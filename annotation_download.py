'''
The following file:
- opens a csv file
- loops over a specific column
- uses the values to download remote files and place them in a folder

python3 annotation_download.py -source_file "data/Groundwater map urls.csv" -column_name Annotation -output_folder "annotations"

#note be sure to add an 'local_annotation' column to the spreadsheet and use the following forumula for the value =CONCATENATE("annotations/",RIGHT(J2, 16),".json")
'''

import argparse
import csv
import urllib.request


parser = argparse.ArgumentParser()
parser.add_argument("-source_file", help="")
parser.add_argument("-column_name", help="")
parser.add_argument("-output_folder", help="")

args = parser.parse_args()

# create file with heading - Alias,CDM_page_id,CDM_field,Value
#Input
input_file=open( args.source_file, 'r' )
csv_reader = csv.DictReader(input_file)

#output


for row in csv_reader:
        # get values from row and download the file
        urllib.request.urlretrieve(row[args.column_name], args.output_folder+"/"+row[args.column_name][row[args.column_name].rfind('/')+1:]+".json")


input_file.close()