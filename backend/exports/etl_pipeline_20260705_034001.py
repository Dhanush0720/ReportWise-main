import pandas as pd
import numpy as np

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans the product inventory DataFrame based on specified diagnostics and business rules.

    Args:
        df (pd.DataFrame): The raw input DataFrame.

    Returns:
        pd.DataFrame: The cleaned and feature-engineered DataFrame.
    """

    # 1. Remove duplicate rows
    df.drop_duplicates(inplace=True)

    # 2. Handle outliers by clipping values at the 99th percentile and ensuring non-negativity
    numeric_cols_to_clip = ['Unit Cost', 'Retail Price', 'Units Sold', 'Closing Stock']
    for col in numeric_cols_to_clip:
        if col in df.columns:
            upper_bound = df[col].quantile(0.99)
            df[col] = df[col].clip(upper=upper_bound)
            df[col] = np.maximum(0, df[col]) # Ensure values are non-negative

    # 3. Enforce Retail Price >= Unit Cost
    df['Retail Price'] = np.where(df['Retail Price'] < df['Unit Cost'], df['Unit Cost'], df['Retail Price'])

    # 4. Ensure Units Sold does not exceed Opening Stock and recalculate Closing Stock
    df['Units Sold'] = np.minimum(df['Units Sold'], df['Opening Stock'])
    df['Closing Stock'] = df['Opening Stock'] - df['Units Sold']
    df['Closing Stock'] = np.maximum(0, df['Closing Stock']) # Final check for non-negativity

    # 5. Validate and correct Stock Status based on Closing Stock and Reorder Point
    df['Stock Status'] = np.where(
        df['Closing Stock'] <= df['Reorder Point'], 'Low Stock', 'In Stock'
    )

    # 6. Feature Engineering
    # Profit Margin
    df['Profit_Margin'] = df['Retail Price'] - df['Unit Cost']

    # Profit Margin Percentage (handle division by zero for Unit Cost)
    # If Unit Cost is 0, percentage is undefined or 0 if Profit Margin is also 0. Let's set to 0.
    df['Profit_Margin_Percentage'] = np.where(
        df['Unit Cost'] > 0,
        (df['Profit_Margin'] / df['Unit Cost']) * 100,
        0 # Handle cases where Unit Cost is 0 or less (though already capped at 0)
    )

    # Is Below Reorder Point
    df['Is_Below_Reorder_Point'] = (df['Closing Stock'] <= df['Reorder Point'])

    # Current Stock Value (at cost and retail price)
    df['Current_Stock_Value_Cost'] = df['Closing Stock'] * df['Unit Cost']
    df['Current_Stock_Value_Retail'] = df['Closing Stock'] * df['Retail Price']

    return df
