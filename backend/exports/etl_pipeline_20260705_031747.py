import pandas as pd
import numpy as np

def clean_data(df):
    # Fallback cleaning code
    df_clean = df.dropna(how='all')
    return df_clean
