from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..models.database import get_db
from ..models.models import Consumption
from ..ml.forecasting import generate_forecast
from pydantic import BaseModel
from datetime import datetime
import pandas as pd
import io


router = APIRouter()


# ============================================================
# CONSUMPTION INPUT MODEL
# ============================================================

class ConsumptionCreate(BaseModel):
    kwh: float
    date: datetime
    source: str = "grid"


# ============================================================
# ADD MANUAL CONSUMPTION DATA
# ============================================================

@router.post("/consumption/{household_id}")
def add_consumption(
    household_id: int,
    consumption: ConsumptionCreate,
    db: Session = Depends(get_db)
):

    if consumption.kwh < 0:

        raise HTTPException(
            status_code=400,
            detail="Consumption cannot be negative."
        )

    db_consumption = Consumption(
        household_id=household_id,
        kwh=consumption.kwh,
        date=consumption.date,
        source=consumption.source
    )

    db.add(db_consumption)
    db.commit()
    db.refresh(db_consumption)

    return {
        "message": "Consumption added",
        "id": db_consumption.id
    }


# ============================================================
# FORECAST USING HOUSEHOLD DATABASE DATA
# ============================================================

@router.get("/forecast/{household_id}")
async def get_forecast_api(
    household_id: int,
    db: Session = Depends(get_db)
):

    try:

        # ----------------------------------------------------
        # GET HOUSEHOLD CONSUMPTION HISTORY
        # ----------------------------------------------------

        history = (
            db.query(Consumption)
            .filter(
                Consumption.household_id == household_id
            )
            .order_by(
                Consumption.date.asc()
            )
            .all()
        )

        # ----------------------------------------------------
        # NO DATA
        # ----------------------------------------------------

        if not history:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"No consumption data found for "
                    f"household {household_id}. "
                    "Please add consumption data first."
                )
            )

        # ----------------------------------------------------
        # CONVERT DATABASE DATA
        # ----------------------------------------------------

        data = []

        for consumption in history:

            data.append(
                {
                    "timestamp":
                        consumption.date.isoformat(),

                    "kwh":
                        float(consumption.kwh)
                }
            )

        # ----------------------------------------------------
        # GENERATE FORECAST
        # ----------------------------------------------------

        result = generate_forecast(
            data
        )

        # ----------------------------------------------------
        # RETURN ONLY USER-FACING FORECAST DATA
        # ----------------------------------------------------

        if not isinstance(result, dict):

            raise HTTPException(
                status_code=500,
                detail="Invalid forecasting response."
            )

        summary = result.get(
            "summary",
            {}
        )

        forecast = result.get(
            "forecast",
            []
        )

        return {

            "status":
                "success",

            "data_source":
                "household_data",

            "summary": {

                "forecast_days":
                    summary.get(
                        "forecast_days",
                        len(forecast)
                    ),

                "total_forecast_kwh":
                    summary.get(
                        "total_forecast_kwh",
                        0
                    ),

                "average_daily_forecast_kwh":
                    summary.get(
                        "average_daily_forecast_kwh",
                        0
                    ),

                "last_historical_date":
                    summary.get(
                        "last_historical_date"
                    )
            },

            "forecast":
                forecast
        }

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Forecasting failed: {str(e)}"
            )
        )


# ============================================================
# UPLOAD USER CSV DATASET
#
# The uploaded CSV is USER HISTORICAL DATA.
#
# It is NOT used as the original ML training dataset.
#
# forecasting.py handles:
#
#     Training CSV
#         -> trains and compares models internally
#
#     Uploaded CSV
#         -> provides the user's historical consumption
#         -> generates the user's 30-day forecast
#
# The user receives ONLY forecast-related information.
# ============================================================

@router.post("/forecast/upload")
async def upload_forecast_dataset(
    file: UploadFile = File(...)
):

    try:

        # ----------------------------------------------------
        # CHECK FILE NAME
        # ----------------------------------------------------

        if not file.filename:

            raise HTTPException(
                status_code=400,
                detail="No file was selected."
            )

        # ----------------------------------------------------
        # CHECK CSV FORMAT
        # ----------------------------------------------------

        if not file.filename.lower().endswith(".csv"):

            raise HTTPException(
                status_code=400,
                detail="Please upload a CSV file."
            )

        # ----------------------------------------------------
        # READ UPLOADED FILE
        # ----------------------------------------------------

        file_content = await file.read()

        if not file_content:

            raise HTTPException(
                status_code=400,
                detail="Uploaded CSV file is empty."
            )

        try:

            df = pd.read_csv(
                io.BytesIO(file_content)
            )

        except Exception as e:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unable to read CSV file: {str(e)}"
                )
            )

        # ----------------------------------------------------
        # CHECK DATASET
        # ----------------------------------------------------

        if df.empty:

            raise HTTPException(
                status_code=400,
                detail="Uploaded CSV contains no records."
            )

        # ----------------------------------------------------
        # CHECK MINIMUM RECORD COUNT
        #
        # forecasting.py requires enough historical
        # records for lag and rolling features.
        # ----------------------------------------------------

        if len(df) < 15:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Uploaded CSV must contain at least "
                    "15 records of historical energy data."
                )
            )

        # ----------------------------------------------------
        # CONVERT CSV TO RECORDS
        # ----------------------------------------------------

        user_data = df.to_dict(
            orient="records"
        )

        # ----------------------------------------------------
        # GENERATE FORECAST
        # ----------------------------------------------------

        result = generate_forecast(
            user_data
        )

        # ----------------------------------------------------
        # VALIDATE FORECASTING RESPONSE
        # ----------------------------------------------------

        if not isinstance(result, dict):

            raise HTTPException(
                status_code=500,
                detail="Invalid forecasting response."
            )

        # ----------------------------------------------------
        # EXTRACT USER-FACING DATA ONLY
        #
        # Do NOT expose:
        # - best model
        # - model comparison
        # - MAE
        # - RMSE
        # - R2
        # - MAPE
        # - training dataset information
        # ----------------------------------------------------

        summary = result.get(
            "summary",
            {}
        )

        forecast = result.get(
            "forecast",
            []
        )

        # ----------------------------------------------------
        # RETURN USER RESULT
        # ----------------------------------------------------

        return {

            "status":
                "success",

            "data_source":
                "user_dataset",

            "summary": {

                "forecast_days":
                    summary.get(
                        "forecast_days",
                        len(forecast)
                    ),

                "total_forecast_kwh":
                    round(
                        float(
                            summary.get(
                                "total_forecast_kwh",
                                0
                            )
                        ),
                        3
                    ),

                "average_daily_forecast_kwh":
                    round(
                        float(
                            summary.get(
                                "average_daily_forecast_kwh",
                                0
                            )
                        ),
                        3
                    ),

                "last_historical_date":
                    summary.get(
                        "last_historical_date"
                    )
            },

            "forecast":
                forecast,

            "uploaded_file":
                file.filename,

            "uploaded_records":
                len(df)
        }

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Forecast upload failed: {str(e)}"
            )
        )