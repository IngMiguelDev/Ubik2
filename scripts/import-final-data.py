"""Import the delivered GeoJSONs and XLSX dictionary without third-party packages."""
import csv
import json
import shutil
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

source = Path(sys.argv[1])
target = Path(__file__).resolve().parents[1] / 'public' / 'data'
ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(source / 'Diccionario campos upz brecha 95.xlsx') as book:
    strings = [''.join(s.itertext()) for s in ET.fromstring(book.read('xl/sharedStrings.xml')).findall('m:si', ns)] if 'xl/sharedStrings.xml' in book.namelist() else []
    table = []
    for row in ET.fromstring(book.read('xl/worksheets/sheet1.xml')).findall('.//m:row', ns):
        cells = []
        for cell in row:
            v = cell.find('m:v', ns)
            inline = cell.find('m:is', ns)
            cells.append(strings[int(v.text)] if cell.get('t') == 's' else ''.join(inline.itertext()) if inline is not None else v.text if v is not None else '')
        table.append(cells)
definitions = [dict(zip(['field', 'group', 'description', 'unit', 'usage'], row)) for row in table[1:] if len(row) == 5]
geo = json.loads((source / 'upz_brecha_95.geojson').read_text(encoding='utf-8'))
rows = [dict(f['properties']) for f in geo['features']]
assert len(rows) == 95 and len({r['cod_upz_grupo'] for r in rows}) == 95
schema = {'codigo': 'cod_upz_grupo', 'nombre': 'NOMBRE_UPZ_GRUPO', 'localidad': 'localidad', 'tipo': 'tipo_dominio', 'brecha': 'brecha', 'ranking': 'prioridad'}
for line, prefix in [('barrios', 'barrios'), ('vivienda', 'viv'), ('curaduria', 'cps'), ('titulacion', 'tit'), ('reasentamientos', 'reas')]:
    schema['registros_' + line] = prefix + '_presencia'
    schema['tasa_' + line] = prefix + '_x1000hog'
for row in rows:
    row['tipo_dominio'] = 'grupo_UPZ' if row['es_agrupacion'] else 'UPZ'
columns = list(rows[0])
dataset = {'rows': rows, 'columns': columns, 'schema': schema, 'source': {'name': 'upz_brecha_95.geojson', 'date': None, 'license': None}, 'status': 'final', 'fieldDefinitions': definitions}
(target / 'final-dataset.json').write_text(json.dumps(dataset, ensure_ascii=False, indent=2), encoding='utf-8')
with (target / 'upz_brecha_95.csv').open('w', newline='', encoding='utf-8-sig') as out:
    writer = csv.DictWriter(out, fieldnames=columns)
    writer.writeheader()
    writer.writerows(rows)
with (target / 'diccionario_campos_upz_brecha_95.csv').open('w', newline='', encoding='utf-8-sig') as out:
    writer = csv.writer(out)
    writer.writerows(table)
for name in ['upz_brecha_95.geojson', 'idiger_amenaza_mm_urbano.geojson', 'Diccionario campos upz brecha 95.xlsx']:
    shutil.copyfile(source / name, target / name)
print('Imported 95 territories and', len(definitions), 'field definitions.')
