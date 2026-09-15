from pathlib import Path
import warnings

import numpy as np
import pandas as pd

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

warnings.filterwarnings("ignore")


# ============================================================
# CONFIGURATION
# ============================================================

API_DIR = Path(__file__).resolve().parent.parent

TRAINING_DATASET_PATH = (
    API_DIR
    / "data"
    / "training"
    / "household_energy_training_dataset.csv"
)

TARGET_COLUMN = "kwh"

MIN_TRAINING_RECORDS = 30
MIN_USER_RECORDS = 15

FORECAST_DAYS = 30


# ============================================================
# XGBOOST
# ============================================================

try:
    from xgboost import XGBRegressor

    XGBOOST_AVAILABLE = True

except ImportError:
    XGBOOST_AVAILABLE = False


# ============================================================
# NORMALIZE COLUMN NAMES
# ============================================================

def normalize_columns(df):

    df = df.copy()

    df.columns = [
        str(column)
        .strip()
        .lower()
        .replace(" ", "_")
        .replace("-", "_")
        for column in df.columns
    ]

    return df


# ============================================================
# FIND DATE COLUMN
# ============================================================

def find_date_column(df):

    possible_columns = [
        "timestamp",
        "datetime",
        "date_time",
        "date",
        "time"
    ]

    for column in possible_columns:

        if column in df.columns:
            return column

    return None


# ============================================================
# FIND CONSUMPTION COLUMN
# ============================================================

def find_consumption_column(df):

    possible_columns = [
        "kwh",
        "consumption",
        "energy_consumption",
        "energy",
        "usage",
        "electricity_consumption",
        "units"
    ]

    for column in possible_columns:

        if column in df.columns:
            return column

    return None


# ============================================================
# LOAD TRAINING DATASET
# ============================================================

def load_training_dataset():

    if not TRAINING_DATASET_PATH.exists():

        raise FileNotFoundError(
            "Training dataset was not found.\n"
            f"Expected location:\n"
            f"{TRAINING_DATASET_PATH}"
        )

    df = pd.read_csv(
        TRAINING_DATASET_PATH
    )

    if df.empty:

        raise ValueError(
            "Training dataset is empty."
        )

    return df


# ============================================================
# PREPARE INPUT DATA
# ============================================================

def prepare_input_data(data):

    if data is None:

        raise ValueError(
            "No energy data was provided."
        )

    if isinstance(data, pd.DataFrame):

        df = data.copy()

    else:

        df = pd.DataFrame(data)

    if df.empty:

        raise ValueError(
            "Energy dataset is empty."
        )

    df = normalize_columns(df)

    # --------------------------------------------------------
    # DATE
    # --------------------------------------------------------

    date_column = find_date_column(df)

    if date_column is None:

        raise ValueError(
            "Dataset must contain a date or timestamp column."
        )

    if date_column != "timestamp":

        df.rename(
            columns={
                date_column: "timestamp"
            },
            inplace=True
        )

    # --------------------------------------------------------
    # CONSUMPTION
    # --------------------------------------------------------

    consumption_column = find_consumption_column(df)

    if consumption_column is None:

        raise ValueError(
            "Dataset must contain electricity consumption "
            "data such as kwh, consumption, energy, usage "
            "or units."
        )

    if consumption_column != TARGET_COLUMN:

        df.rename(
            columns={
                consumption_column: TARGET_COLUMN
            },
            inplace=True
        )

    # --------------------------------------------------------
    # DATA TYPES
    # --------------------------------------------------------

    df["timestamp"] = pd.to_datetime(
        df["timestamp"],
        errors="coerce"
    )

    df[TARGET_COLUMN] = pd.to_numeric(
        df[TARGET_COLUMN],
        errors="coerce"
    )

    # --------------------------------------------------------
    # REMOVE INVALID VALUES
    # --------------------------------------------------------

    df = df.dropna(
        subset=[
            "timestamp",
            TARGET_COLUMN
        ]
    )

    df = df[
        df[TARGET_COLUMN] >= 0
    ]

    df = df.sort_values(
        "timestamp"
    )

    df = df.reset_index(
        drop=True
    )

    if df.empty:

        raise ValueError(
            "No valid energy consumption records were found."
        )

    return df


# ============================================================
# FEATURE ENGINEERING
# ============================================================

def create_features(df):

    df = df.copy()

    # ========================================================
    # DATE FEATURES
    # ========================================================

    df["year"] = (
        df["timestamp"].dt.year
    )

    df["month"] = (
        df["timestamp"].dt.month
    )

    df["day"] = (
        df["timestamp"].dt.day
    )

    df["day_of_week"] = (
        df["timestamp"].dt.dayofweek
    )

    df["day_of_year"] = (
        df["timestamp"].dt.dayofyear
    )

    df["week_of_year"] = (
        df["timestamp"]
        .dt.isocalendar()
        .week
        .astype(int)
    )

    df["is_weekend"] = (
        df["day_of_week"] >= 5
    ).astype(int)

    # ========================================================
    # CYCLIC DATE FEATURES
    # ========================================================

    df["month_sin"] = np.sin(
        2 * np.pi * df["month"] / 12
    )

    df["month_cos"] = np.cos(
        2 * np.pi * df["month"] / 12
    )

    df["dow_sin"] = np.sin(
        2 * np.pi * df["day_of_week"] / 7
    )

    df["dow_cos"] = np.cos(
        2 * np.pi * df["day_of_week"] / 7
    )

    # ========================================================
    # APPLIANCE / ENVIRONMENT FEATURES
    # ========================================================

    numeric_columns = [

        "temperature_c",
        "ac",
        "fridge",
        "lights",
        "fans",
        "washing_machine",
        "tv",
        "geyser",
        "other_appliances"
    ]

    for column in numeric_columns:

        if column not in df.columns:

            df[column] = 0.0

        df[column] = pd.to_numeric(
            df[column],
            errors="coerce"
        )

        if df[column].notna().any():

            median_value = df[column].median()

            df[column] = (
                df[column]
                .fillna(median_value)
            )

        else:

            df[column] = 0.0

    # ========================================================
    # LAG FEATURES
    # ========================================================

    df["lag_1"] = (
        df[TARGET_COLUMN]
        .shift(1)
    )

    df["lag_2"] = (
        df[TARGET_COLUMN]
        .shift(2)
    )

    df["lag_3"] = (
        df[TARGET_COLUMN]
        .shift(3)
    )

    df["lag_7"] = (
        df[TARGET_COLUMN]
        .shift(7)
    )

    # ========================================================
    # ROLLING FEATURES
    # ========================================================

    df["rolling_3"] = (
        df[TARGET_COLUMN]
        .shift(1)
        .rolling(3)
        .mean()
    )

    df["rolling_7"] = (
        df[TARGET_COLUMN]
        .shift(1)
        .rolling(7)
        .mean()
    )

    df["rolling_14"] = (
        df[TARGET_COLUMN]
        .shift(1)
        .rolling(14)
        .mean()
    )

    # ========================================================
    # CLEAN
    # ========================================================

    df = df.replace(
        [np.inf, -np.inf],
        np.nan
    )

    df = df.dropna()

    df = df.reset_index(
        drop=True
    )

    return df


# ============================================================
# MODEL FEATURES
# ============================================================

FEATURE_COLUMNS = [

    "year",
    "month",
    "day",
    "day_of_week",
    "day_of_year",
    "week_of_year",
    "is_weekend",

    "month_sin",
    "month_cos",
    "dow_sin",
    "dow_cos",

    "temperature_c",
    "ac",
    "fridge",
    "lights",
    "fans",
    "washing_machine",
    "tv",
    "geyser",
    "other_appliances",

    "lag_1",
    "lag_2",
    "lag_3",
    "lag_7",

    "rolling_3",
    "rolling_7",
    "rolling_14"
]


# ============================================================
# CREATE FEATURE MATRIX
# ============================================================

def make_feature_matrix(df):

    missing_columns = [
        column
        for column in FEATURE_COLUMNS
        if column not in df.columns
    ]

    if missing_columns:

        raise ValueError(
            "Missing required feature columns: "
            + ", ".join(missing_columns)
        )

    X = df[
        FEATURE_COLUMNS
    ].copy()

    y = df[
        TARGET_COLUMN
    ].copy()

    X = X.replace(
        [np.inf, -np.inf],
        np.nan
    )

    X = X.fillna(0)

    return X, y


# ============================================================
# MAPE
# ============================================================

def calculate_mape(
    y_true,
    y_pred
):

    y_true = np.asarray(
        y_true
    )

    y_pred = np.asarray(
        y_pred
    )

    mask = y_true != 0

    if not np.any(mask):

        return 0.0

    return float(
        np.mean(
            np.abs(
                (
                    y_true[mask]
                    - y_pred[mask]
                )
                / y_true[mask]
            )
        ) * 100
    )


# ============================================================
# TRAIN LINEAR REGRESSION
# ============================================================

def train_linear_regression(
    X_train,
    y_train
):

    model = LinearRegression()

    model.fit(
        X_train,
        y_train
    )

    return model


# ============================================================
# TRAIN RANDOM FOREST
# ============================================================

def train_random_forest(
    X_train,
    y_train
):

    model = RandomForestRegressor(

        n_estimators=300,

        max_depth=12,

        min_samples_split=4,

        min_samples_leaf=2,

        random_state=42,

        n_jobs=-1
    )

    model.fit(
        X_train,
        y_train
    )

    return model


# ============================================================
# TRAIN XGBOOST
# ============================================================

def train_xgboost(
    X_train,
    y_train
):

    if not XGBOOST_AVAILABLE:

        raise ImportError(
            "XGBoost is not installed. "
            "Run: pip install xgboost"
        )

    model = XGBRegressor(

        n_estimators=300,

        max_depth=6,

        learning_rate=0.05,

        subsample=0.8,

        colsample_bytree=0.8,

        objective="reg:squarederror",

        random_state=42,

        n_jobs=-1
    )

    model.fit(
        X_train,
        y_train
    )

    return model


# ============================================================
# TRAIN AND COMPARE MODELS
#
# The three models are trained and evaluated internally.
# The comparison is NOT exposed to the household user.
# ============================================================

def train_and_compare_models(
    training_df
):

    prepared_df = create_features(
        training_df
    )

    if len(prepared_df) < MIN_TRAINING_RECORDS:

        raise ValueError(
            "Not enough training records."
        )

    X, y = make_feature_matrix(
        prepared_df
    )

    # --------------------------------------------------------
    # TIME-BASED SPLIT
    # --------------------------------------------------------

    split_index = int(
        len(X) * 0.80
    )

    if split_index <= 0 or split_index >= len(X):

        raise ValueError(
            "Training dataset is too small "
            "for a time-based train/test split."
        )

    X_train = X.iloc[:split_index]

    X_test = X.iloc[split_index:]

    y_train = y.iloc[:split_index]

    y_test = y.iloc[split_index:]

    # --------------------------------------------------------
    # TRAIN MODELS
    # --------------------------------------------------------

    models = {}

    models["Linear Regression"] = (
        train_linear_regression(
            X_train,
            y_train
        )
    )

    models["Random Forest"] = (
        train_random_forest(
            X_train,
            y_train
        )
    )

    models["XGBoost"] = (
        train_xgboost(
            X_train,
            y_train
        )
    )

    # --------------------------------------------------------
    # EVALUATE
    # --------------------------------------------------------

    results = {}

    best_model_name = None

    best_rmse = float("inf")

    for model_name, model in models.items():

        predictions = model.predict(
            X_test
        )

        predictions = np.maximum(
            predictions,
            0
        )

        mae = mean_absolute_error(
            y_test,
            predictions
        )

        rmse = np.sqrt(
            mean_squared_error(
                y_test,
                predictions
            )
        )

        r2 = r2_score(
            y_test,
            predictions
        )

        mape = calculate_mape(
            y_test,
            predictions
        )

        results[model_name] = {

            "mae": round(
                float(mae),
                4
            ),

            "rmse": round(
                float(rmse),
                4
            ),

            "r2": round(
                float(r2),
                4
            ),

            "mape": round(
                float(mape),
                2
            )
        }

        if rmse < best_rmse:

            best_rmse = rmse

            best_model_name = model_name

    # --------------------------------------------------------
    # RETRAIN BEST MODEL USING ALL TRAINING DATA
    # --------------------------------------------------------

    if best_model_name == "Linear Regression":

        best_model = train_linear_regression(
            X,
            y
        )

    elif best_model_name == "Random Forest":

        best_model = train_random_forest(
            X,
            y
        )

    else:

        best_model = train_xgboost(
            X,
            y
        )

    return {

        "best_model":
            best_model,

        "best_model_name":
            best_model_name,

        "results":
            results,

        "feature_columns":
            FEATURE_COLUMNS
    }


# ============================================================
# TRAIN FROM TRAINING DATASET
# ============================================================

def train_from_training_dataset():

    training_df = load_training_dataset()

    training_df = prepare_input_data(
        training_df
    )

    return train_and_compare_models(
        training_df
    )


# ============================================================
# PREPARE USER DATA
# ============================================================

def prepare_user_data(
    user_data
):

    user_df = prepare_input_data(
        user_data
    )

    if len(user_df) < MIN_USER_RECORDS:

        raise ValueError(
            f"User dataset must contain at least "
            f"{MIN_USER_RECORDS} valid records."
        )

    prepared_user_df = create_features(
        user_df
    )

    if prepared_user_df.empty:

        raise ValueError(
            "User dataset does not contain enough "
            "usable records after feature engineering."
        )

    return prepared_user_df


# ============================================================
# BUILD FUTURE USER ROW
#
# Future appliance/environment values are estimated from the
# user's recent history. They are NOT taken from the training
# dataset.
# ============================================================

def build_future_row(
    forecast_history,
    next_date
):

    numeric_columns = [

        "temperature_c",
        "ac",
        "fridge",
        "lights",
        "fans",
        "washing_machine",
        "tv",
        "geyser",
        "other_appliances"
    ]

    future_row = {

        "timestamp":
            next_date
    }

    # --------------------------------------------------------
    # USE DAY-OF-WEEK HISTORY WHEN POSSIBLE
    #
    # This prevents the future forecast from becoming a
    # constant average and preserves the user's weekly pattern.
    # --------------------------------------------------------

    target_day = next_date.dayofweek

    same_day_history = (
        forecast_history[
            forecast_history["timestamp"].dt.dayofweek
            == target_day
        ]
        .tail(4)
    )

    recent_data = (
        forecast_history
        .tail(14)
    )

    for column in numeric_columns:

        values = pd.Series(
            dtype=float
        )

        if column in same_day_history.columns:

            values = (
                pd.to_numeric(
                    same_day_history[column],
                    errors="coerce"
                )
                .dropna()
            )

        if len(values) == 0 and column in recent_data.columns:

            values = (
                pd.to_numeric(
                    recent_data[column],
                    errors="coerce"
                )
                .dropna()
            )

        if len(values) > 0:

            future_row[column] = float(
                values.mean()
            )

        else:

            future_row[column] = 0.0

    return future_row


# ============================================================
# GENERATE RECURSIVE 30-DAY FORECAST
#
# IMPORTANT:
# - Training dataset trains the selected model.
# - User CSV is household history.
# - User CSV is NOT used to retrain the model.
# - Future predictions are recursively fed into lag/rolling
#   features.
# - Appliance/environment values come from user history.
# ============================================================

def generate_30_day_forecast(
    user_df,
    trained_model
):

    forecast_history = user_df.copy()

    forecast_history["timestamp"] = pd.to_datetime(
        forecast_history["timestamp"],
        errors="coerce"
    )

    forecast_history[TARGET_COLUMN] = pd.to_numeric(
        forecast_history[TARGET_COLUMN],
        errors="coerce"
    )

    forecast_history = (
        forecast_history
        .dropna(
            subset=[
                "timestamp",
                TARGET_COLUMN
            ]
        )
        .sort_values("timestamp")
        .reset_index(drop=True)
    )

    if len(forecast_history) < MIN_USER_RECORDS:

        raise ValueError(
            f"User dataset must contain at least "
            f"{MIN_USER_RECORDS} valid records."
        )

    last_date = pd.Timestamp(
        forecast_history["timestamp"].iloc[-1]
    )

    forecast = []

    # ========================================================
    # RECURSIVE FORECAST
    # ========================================================

    for day_number in range(
        1,
        FORECAST_DAYS + 1
    ):

        next_date = (
            last_date
            + pd.Timedelta(
                days=day_number
            )
        )

        # ----------------------------------------------------
        # CREATE FUTURE USER ROW
        # ----------------------------------------------------

        future_row = build_future_row(
            forecast_history,
            next_date
        )

        # ----------------------------------------------------
        # TEMPORARY HISTORY
        #
        # Use the last actual/predicted kWh as the temporary
        # value only to construct lag features. It is replaced
        # immediately after prediction.
        # ----------------------------------------------------

        if len(forecast_history) > 0:

            future_row[TARGET_COLUMN] = float(
                forecast_history[
                    TARGET_COLUMN
                ].iloc[-1]
            )

        else:

            future_row[TARGET_COLUMN] = 0.0

        temporary_history = pd.concat(
            [
                forecast_history,
                pd.DataFrame(
                    [future_row]
                )
            ],
            ignore_index=True
        )

        # ----------------------------------------------------
        # CREATE FEATURES
        # ----------------------------------------------------

        temporary_features = create_features(
            temporary_history
        )

        if temporary_features.empty:

            raise ValueError(
                "Unable to create forecast features."
            )

        latest_features = (
            temporary_features
            .iloc[-1:]
        )

        X_future = latest_features[
            FEATURE_COLUMNS
        ].copy()

        X_future = X_future.replace(
            [np.inf, -np.inf],
            np.nan
        )

        X_future = X_future.fillna(0)

        # ----------------------------------------------------
        # PREDICT
        # ----------------------------------------------------

        predicted_kwh = (
            trained_model
            .predict(
                X_future
            )[0]
        )

        predicted_kwh = max(
            float(predicted_kwh),
            0.0
        )

        # ----------------------------------------------------
        # SAVE FORECAST
        # ----------------------------------------------------

        forecast.append(
            {

                "date":
                    next_date.strftime(
                        "%Y-%m-%d"
                    ),

                "predicted_kwh":
                    round(
                        predicted_kwh,
                        3
                    )
            }
        )

        # ----------------------------------------------------
        # ADD ACTUAL PREDICTION TO HISTORY
        #
        # This is the important recursive step.
        # The next day's lag_1, lag_2, lag_3, lag_7 and rolling
        # values will now use previous forecast values.
        # ----------------------------------------------------

        future_row[TARGET_COLUMN] = (
            predicted_kwh
        )

        forecast_history = pd.concat(
            [
                forecast_history,
                pd.DataFrame(
                    [future_row]
                )
            ],
            ignore_index=True
        )

    return (
        forecast,
        last_date
    )


# ============================================================
# FORECAST USER DATA
#
# USER-FACING RESPONSE CONTAINS ONLY:
# - status
# - summary
# - 30-day forecast
# ============================================================

def forecast_user_data(
    user_data,
    trained_model=None,
    best_model_name=None,
    model_results=None
):

    # --------------------------------------------------------
    # TRAIN MODEL IF NOT PROVIDED
    # --------------------------------------------------------

    if trained_model is None:

        training_result = (
            train_from_training_dataset()
        )

        trained_model = (
            training_result["best_model"]
        )

    # --------------------------------------------------------
    # PREPARE USER DATA
    # --------------------------------------------------------

    original_user_df = prepare_input_data(
        user_data
    )

    prepared_user_df = prepare_user_data(
        user_data
    )

    # --------------------------------------------------------
    # GENERATE 30-DAY FORECAST
    # --------------------------------------------------------

    forecast, last_date = (
        generate_30_day_forecast(
            original_user_df,
            trained_model
        )
    )

    # ========================================================
    # SUMMARY
    # ========================================================

    forecast_values = [

        item["predicted_kwh"]

        for item in forecast
    ]

    if forecast_values:

        total_forecast = float(
            np.sum(
                forecast_values
            )
        )

        average_forecast = float(
            np.mean(
                forecast_values
            )
        )

    else:

        total_forecast = 0.0

        average_forecast = 0.0

    # ========================================================
    # USER-FACING RESPONSE ONLY
    # ========================================================

    return {

        "status":
            "success",

        "data_source":
            "user_dataset",

        "summary": {

            "forecast_days":
                len(forecast),

            "total_forecast_kwh":
                round(
                    total_forecast,
                    3
                ),

            "average_daily_forecast_kwh":
                round(
                    average_forecast,
                    3
                ),

            "last_historical_date":
                last_date.strftime(
                    "%Y-%m-%d"
                )
        },

        "forecast":
            forecast
    }


# ============================================================
# MAIN FORECAST FUNCTION
# ============================================================

def generate_forecast(
    user_data=None
):

    # --------------------------------------------------------
    # NO USER DATA
    #
    # Used for internal training/testing only.
    # --------------------------------------------------------

    if user_data is None:

        training_result = (
            train_from_training_dataset()
        )

        return {

            "status":
                "training_completed",

            "data_source":
                "training_dataset_only",

            "message":
                "Models trained and compared. "
                "Provide user data to generate "
                "a household forecast.",

            "best_model":
                training_result[
                    "best_model_name"
                ],

            "models_evaluated": [

                "Linear Regression",
                "Random Forest",
                "XGBoost"
            ],

            "results":
                training_result["results"],

            "training_records":
                "Training dataset"
        }

    # --------------------------------------------------------
    # USER DATA PROVIDED
    # --------------------------------------------------------

    training_result = (
        train_from_training_dataset()
    )

    return forecast_user_data(

        user_data=user_data,

        trained_model=
            training_result["best_model"],

        best_model_name=
            training_result["best_model_name"],

        model_results=
            training_result["results"]
    )


# ============================================================
# COMPATIBILITY FUNCTION
# ============================================================

def forecast_consumption(
    history_data=None
):

    return generate_forecast(
        history_data
    )


# ============================================================
# DIRECT TEST
#
# This tests ONLY the internal training stage.
# It does NOT expose model information through the upload API.
# ============================================================

if __name__ == "__main__":

    print("=" * 60)

    print(
        "SMART HOUSEHOLD ENERGY"
    )

    print(
        "ENERGY FORECASTING TEST"
    )

    print("=" * 60)

    try:

        if not XGBOOST_AVAILABLE:

            print(
                "\nXGBoost: NOT AVAILABLE"
            )

            print(
                "Install it using:"
            )

            print(
                "pip install xgboost"
            )

            raise ImportError(
                "XGBoost is required."
            )

        print(
            "\nXGBoost: AVAILABLE"
        )

        print(
            "\nTraining models using "
            "the training dataset..."
        )

        result = generate_forecast()

        print(
            "\nTraining completed successfully."
        )

        print(
            "\nBest Model:",
            result["best_model"]
        )

        print(
            "\n================ MODEL RESULTS ================"
        )

        for model_name, metrics in (
            result["results"].items()
        ):

            print(
                f"\n{model_name}"
            )

            print(
                "  MAE:",
                metrics["mae"]
            )

            print(
                "  RMSE:",
                metrics["rmse"]
            )

            print(
                "  R2:",
                metrics["r2"]
            )

            print(
                "  MAPE:",
                metrics["mape"],
                "%"
            )

        print(
            "\nThe training dataset was used "
            "ONLY for model training and comparison."
        )

        print(
            "A user's dataset is used separately "
            "for the household forecast."
        )

        print(
            "\nForecasting system is ready."
        )

    except Exception as e:

        print(
            "\nForecasting Error:"
        )

        print(
            type(e).__name__,
            ":",
            str(e)
        )