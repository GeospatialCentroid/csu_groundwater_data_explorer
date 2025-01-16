'''
The following file:
- opens two csv files
- matching each on a column
- saves just those that were matched


python3 join_csv_to_csv.py -file1 "data/CSU - Groundwater Data Collection New Export - all.tsv" -file1_column_name "CONTENTdm number" -file2 "data/Groundwater map urls.csv" -file2_column_name ID -output_file "output.csv"

'''

import argparse

import pandas as pd


parser = argparse.ArgumentParser()
parser.add_argument("-file1", help="")
parser.add_argument("-file1_column_name", help="")
parser.add_argument("-file2", help="")
parser.add_argument("-file2_column_name", help="")
parser.add_argument("-output_file", help="")

args = parser.parse_args()


file1=pd.read_csv(args.file1, sep='\t', encoding = "ISO-8859-1")
print(file1.head())
file2=pd.read_csv(args.file2)
merged_inner = pd.merge(left=file1, right=file2, left_on=args.file1_column_name, right_on=args.file2_column_name)


merged_inner.to_csv(args.output_file)