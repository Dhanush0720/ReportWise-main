import pandas as pd
import numpy as np

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans and engineers features for the product inventory dataset.

    Args:
        df (pd.DataFrame): The raw input DataFrame.

    Returns:
        pd.DataFrame: The cleaned and feature-engineered DataFrame.
    """

    # Create a copy to avoid modifying the original DataFrame
    df_cleaned = df.copy()

    # --- 1. Data Type Conversion ---
    categorical_cols = ['Category', 'Supplier Name', 'Stock Status']
    for col in categorical_cols:
        if col in df_cleaned.columns:
            df_cleaned[col] = df_cleaned[col].astype('category')

    # --- 2. Handle Outliers and Ensure Non-Negativity (Clipping) ---

    # For 'Unit Cost' and 'Retail Price': Clip at 1st and 99th percentile, ensuring values are >= 0
    price_cost_cols = ['Unit Cost', 'Retail Price']
    for col in price_cost_cols:
        if col in df_cleaned.columns:
            lower_bound_pc = max(0.0, df_cleaned[col].quantile(0.01))
            upper_bound_pc = df_cleaned[col].quantile(0.99)
            df_cleaned[col] = df_cleaned[col].clip(lower=lower_bound_pc, upper=upper_bound_pc)

    # For 'Units Sold' and 'Closing Stock': Clip at 0 and 99th percentile, convert to integer
    stock_sold_cols = ['Units Sold', 'Closing Stock']
    for col in stock_sold_cols:
        if col in df_cleaned.columns:
            upper_bound_ss = df_cleaned[col].quantile(0.99)
            df_cleaned[col] = df_cleaned[col].clip(lower=0, upper=upper_bound_ss)
            df_cleaned[col] = df_cleaned[col].astype(int) # Ensure integer type after clipping

    # For 'Opening Stock' and 'Reorder Point': Ensure non-negative, convert to integer
    stock_reorder_cols = ['Opening Stock', 'Reorder Point']
    for col in stock_reorder_cols:
        if col in df_cleaned.columns:
            df_cleaned[col] = df_cleaned[col].clip(lower=0)
            df_cleaned[col] = df_cleaned[col].astype(int) # Ensure integer type

    # --- 3. Consistency Checks & Correction ---

    # Ensure Retail Price is not less than Unit Cost
    if 'Retail Price' in df_cleaned.columns and 'Unit Cost' in df_cleaned.columns:
        df_cleaned['Retail Price'] = np.where(
            df_cleaned['Retail Price'] < df_cleaned['Unit Cost'],
            df_cleaned['Unit Cost'],
            df_cleaned['Retail Price']
        )

    # Inventory Balance Check: Discrepancy between expected and actual closing stock
    if all(col in df_cleaned.columns for col in ['Opening Stock', 'Units Sold', 'Closing Stock']):
        df_cleaned['Inventory_Discrepancy'] = (
            df_cleaned['Opening Stock'] - df_cleaned['Units Sold']
        ) - df_cleaned['Closing Stock']

    # --- 4. Feature Engineering ---

    # Profit Margins
    if all(col in df_cleaned.columns for col in ['Retail Price', 'Unit Cost']):
        df_cleaned['Profit_Margin_Absolute'] = df_cleaned['Retail Price'] - df_cleaned['Unit Cost']
        # Profit_Margin_Percentage: handle division by zero (if Unit Cost is 0)
        df_cleaned['Profit_Margin_Percentage'] = np.where(
            df_cleaned['Unit Cost'] > 0,
            (df_cleaned['Retail Price'] - df_cleaned['Unit Cost']) / df_cleaned['Unit Cost'],
            0.0 # Assign 0.0 if Unit Cost is 0 (assuming no cost leads to no percentage margin representation)
        )

    # Stock Utilization Ratio
    if all(col in df_cleaned.columns for col in ['Units Sold', 'Opening Stock']):
        # Stock Utilization Ratio: How much of the opening stock was sold.
        # Handle division by zero (if Opening Stock is 0)
        df_cleaned['Stock_Utilization_Ratio'] = np.where(
            df_cleaned['Opening Stock'] > 0,
            df_cleaned['Units Sold'] / df_cleaned['Opening Stock'],
            0.0 # Assign 0.0 if Opening Stock is 0 (no stock to utilize)
        )

    # Stock Level Relative to Reorder Point and Sufficiency Ratio
    if all(col in df_cleaned.columns for col in ['Closing Stock', 'Reorder Point']):
        df_cleaned['Stock_Level_Relative_to_Reorder'] = df_cleaned['Closing Stock'] - df_cleaned['Reorder Point']

        # Stock Sufficiency Ratio: Closing Stock / Reorder Point
        # Handle division by zero (if Reorder Point is 0)
        df_cleaned['Stock_Sufficiency_Ratio'] = np.where(
            df_cleaned['Reorder Point'] == 0,
            np.where(df_cleaned['Closing Stock'] > 0, np.inf, 0.0), # If Reorder Point is 0:
                                                                  #   - If Closing Stock > 0, considered infinitely sufficient
                                                                  #   - If Closing Stock == 0, ratio is 0
            df_cleaned['Closing Stock'] / df_cleaned['Reorder Point']
        )

    return df_cleaned