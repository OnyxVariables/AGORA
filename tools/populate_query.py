from bs4 import BeautifulSoup
from faker import Faker

import requests
import sys
import re
import random


def get_csv():
    if (len(sys.argv) < 2):
        url = "https://www.ine.es/CDINEbase/consultar.do?mes=&operacion=Relaci%F3n+de+municipios+y+c%F3digos+por+provincias+y+comunidades+aut%F3nomas&id_oper=Ir"
        print(f"Download the latest file from {url} and export 'diccionario*.xslx' to csv, then run: 'python3 {sys.argv[0]} <CSV file>'")
        sys.exit(1)

    return sys.argv[1]


def parse_csv(csvFilename):
    entireFile = ""
    with open(csvFilename) as f:
        entireFile = f.read()
    
    lines = entireFile.split('\n')[2:]
    fields = []

    is_semicolon = lines[0].find(";") != -1 # CSV might be separated by semicolons instead of commas, depending on the app used to export the xlsx
    for line in lines:
        match = re.search(r"(\d*),(\d*),(\d*),\d*,(.*)", line)
        if is_semicolon:
            match = re.search(r"(\d*);(\d*);(\d*);\d*;(.*)", line)

        if not match:
            continue

        fields.append({
            "autonomousCommunityId": int(match.group(1)),
            "provinceId": int(match.group(2)),
            "municipalityId": int(match.group(3)),
            "municipalityName": match.group(4).strip('"'),
        })

    return fields


def get_data(url):
    response = requests.get(url)
    html = response.text
    soup = BeautifulSoup(html, "html.parser")
    
    tds = soup.select(".miTabla > tr > td")

    return tds


def get_autonomous_communities(url):
    data = get_data(url)
    dataLength = len(data)

    autonomousCommunities = []
    for i in range(0, dataLength, 2):
        autonomousCommunities.append({
            "id": int(re.search(r"<td>(.*)\s*</td>", str(data[i])).group(1)),
            "name": re.search(r"<td>(.*)\s*</td>", str(data[i + 1])).group(1).strip(),
        })
    
    return autonomousCommunities


def get_provinces(url, fields):
    data = get_data(url)
    dataLength = len(data)
    
    kv = {}
    for field in fields:
        kv[field["provinceId"]] = field["autonomousCommunityId"]

    provinces = []
    for i in range(0, dataLength, 2):
        id = int(re.search(r"<td>(.*)\s*</td>", str(data[i])).group(1))
        provinces.append({
            "id": id,
            "autonomousCommunityId": int(kv[id]),
            "name": re.search(r"<td>(.*)\s*</td>", str(data[i + 1])).group(1).strip(),
        })
    
    return provinces

    
def populate_autonomous_community(autonomousCommunities):
    query = "INSERT INTO autonomousCommunity(id, name) VALUES\n"
    for autonomousCommunity in autonomousCommunities:
        query += f"({autonomousCommunity["id"]},\"{autonomousCommunity["name"]}\"),\n"

    query = query[:query.rfind(',')]
    query += ";"

    return query


def populate_province(provinces):
    query = "INSERT INTO province(ineId, autonomousCommunityId, name) VALUES\n"
    for province in provinces:
        query += f"({province["id"]},{province["autonomousCommunityId"]},\"{province["name"]}\"),\n"

    query = query[:query.rfind(',')]
    query += ";"

    return query


def populate_municipality(municipalies):
    query = "INSERT INTO municipality(ineId, provinceId, name) VALUES\n"
    for municipaly in municipalies:
        query += f"({municipaly["id"]},{municipaly["provinceId"]},\"{municipaly["name"]}\"),\n"

    query = query[:query.rfind(',')]
    query += ";"

    return query


def populate_user(numMunicipalities):
    fake = Faker()
    
    query = "INSERT INTO user(name, nicknamePassword, roleId, dni, municipalityId) VALUES\n"
    for _ in range(10000):
        name = fake.name().replace("'", "''")
        nicknamePassword = f"{fake.md5()}{fake.user_name().replace("'", "''")}"
        roleId = 1 if random.randint(1, 10000) < 10 else 2
        dni = fake.random_number(digits=8)
        municipalityId = random.randint(1, numMunicipalities)

        query += f"(\"{name}\", \"{nicknamePassword}\", {roleId}, \"{dni}\", {municipalityId}),\n"
        
    query = query[:query.rfind(',')]
    query += ";"

    return query

query = ""

csvFilename = get_csv()
fields = parse_csv(csvFilename)

autonomousCommunities = get_autonomous_communities("https://www.ine.es/daco/daco42/codmun/cod_ccaa.htm")
query += populate_autonomous_community(autonomousCommunities) + "\n"

provinces = get_provinces("https://www.ine.es/daco/daco42/codmun/cod_provincia.htm", fields)
query += populate_province(provinces) + "\n"

municipalities = [
    {
        "id": field["municipalityId"],
        "provinceId": field["provinceId"],
        "name": field["municipalityName"],
    } for field in fields
]
query += populate_municipality(municipalities) + "\n"

query += populate_user(len(municipalities)) + "\n"

with open('insert.sql', "w") as f:
    f.write(query)
