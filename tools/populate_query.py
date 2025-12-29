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
    with open(csvFilename, encoding="utf8") as f:
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
            "id": int(data[i].get_text(strip = True)),
            "name": data[i + 1].get_text(strip = True),
        })
    
    return autonomousCommunities


province_id_map = {}
def get_provinces(url, fields):
    data = get_data(url)
    dataLength = len(data)
    
    kv = {}
    for field in fields:
        kv[field["provinceId"]] = field["autonomousCommunityId"]

    provinces = []
    auto_id = 1
    for i in range(0, dataLength, 2):
        ine_id = int(data[i].get_text(strip = True))
        province_id_map[ine_id] = auto_id
        provinces.append({
            "id": auto_id,
            "ineId": ine_id,
            "autonomousCommunityId": int(kv[ine_id]),
            "name": data[i + 1].get_text(strip = True),
        })
        auto_id += 1

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
        query += f"({province["ineId"]},{province["autonomousCommunityId"]},\"{province["name"]}\"),\n"

    query = query[:query.rfind(',')]
    query += ";"

    return query


def populate_municipality(municipalities):
    query = "INSERT INTO municipality(ineId, provinceId, name) VALUES\n"
    for municipality in municipalities:
        query += f"({municipality["id"]},{municipality["provinceId"]},\"{municipality["name"]}\"),\n"

    query = query[:query.rfind(',')]
    query += ";"

    return query



def populate_user(numMunicipalities):
    fake = Faker()

    def generate_dni():
        letters = "TRWAGMYFPDXBNJZSQVHLCKE"
        randNum = fake.numerify("########")

        return randNum + letters[int(randNum) % len(letters)]
    
    query = "INSERT INTO user(name, nicknamePassword, roleId, dni, municipalityId) VALUES\n"
    for _ in range(10000):
        name = fake.name().replace("'", "''")
        nicknamePassword = f"{fake.md5()}{fake.user_name().replace("'", "''")}"
        roleId = 1 if random.randint(1, 10000) < 10 else 2
        dni = generate_dni()
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
        "provinceId": province_id_map[field["provinceId"]],
        "name": field["municipalityName"],
    } for field in fields
]
query += populate_municipality(municipalities) + "\n"

query += populate_user(len(municipalities)) + "\n"

with open('insert.sql', "w", encoding="utf8") as f:
    f.write(query)
