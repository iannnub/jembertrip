import pandas as pd

implicit_df = pd.read_csv("data/implicit_data_new.csv")
print("Total rows:", len(implicit_df))
print("Unique users:", implicit_df['user_id'].nunique())
print("Unique destinations:", implicit_df['wisata_id'].nunique())
print("Clicks per user description:")
print(implicit_df.groupby('user_id').size().describe())
