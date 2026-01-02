import os
import time
import sqlite3
import datetime
import subprocess

db = "/home/jonaszeiser/.config/com.verwaltungssoftware.app/company.db"

def deleteDatabase():
    os.system(f"rm {db}")

def seedDatabase():
    con = sqlite3.connect(db)
    cur = con.cursor()
    cur.execute(f""" 
    INSERT INTO company_data (unternehmensname, zusatz, adresszeile1, plz, ort, direktorTitel, direktorName, bearbeitet)
                VALUES ('Zeiser + Sohn', 'UG (haftungsbeschr.)', 'Dürerstr. 109', '68163', 'Mannheim', 'Geschäftsführer', 'Arthur Zeiser', '{datetime.datetime.now().isoformat()}');
    """)
    cur.execute(f"""INSERT INTO mandanten (id, mandantName, adresszeile1, plz, ort, verwaltungsart, wirtschaftsjahrBeginn, wirtschaftsjahrEnde, aktuellesWirtschaftsjahr, summeOffenerPosten, bearbeitet)
                VALUES ('1', 'Schafweide 73', 'Schafweide 73', '68167', 'Mannheim', 'WEG', '01.01', '31.12', '2025', 1234.56, '{datetime.datetime.now().isoformat()}');
    """)
    con.commit()
    cur.execute("SELECT * FROM company_data;")
    cur.execute("SELECT * FROM mandanten;")
    con.close()


deleteDatabase()
session = subprocess.Popen(["pnpm tauri dev"], shell=True)
ready = False
while (not ready):
    print("waiting for db to be created by software")
    if(os.path.isfile(db)):
        ready = True
    time.sleep(1) # Wait for one second with checking
seedDatabase()
print("Successfully Seeded DB")
(output, error) = session.communicate()