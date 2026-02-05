# MATF-RVTECH-AWSCLOUD-2025


# EV Punjači - Serverless Aplikacija

Aplikacija za prikaz EV punjača u Srbiji.

## Setup
npm install

## Struktura 

index.js - Lambda funkcija koja query-uje DynamoDB po gradu (koristi GSI TownIndex)
web/index.html - Frontend sa Leaflet mapom za prikaz punjača  

## Pokretanje aplikacije 
1. Zaustavi postojeće kontejnere (opciono, ako ima nekih) 
docker-compose down -v

2. Pokreni LocalStack 
docker-compose up -d

Sačekaj ~5 sekundi da se LocalStack potpuno pokrene. 
3. Deploy Serverless infrastrukture 
npx serverless deploy

4. Deploy frontend na S3 
npm run deploy-frontend-fixed-bucket

Napomena: Pre deploy-a frontenda, ažuriraj API_ID u web/index.html. 
Pristup aplikaciji 
Aplikacija će trčati na: 
**http://punjaci-website.s3-website.localhost.localstack.cloud:4566/**

Funkcionalnosti: 
✅ Mapa - Prikaz punjača na interaktivnoj mapi (Leaflet)
✅ Pretraga po gradu - Unesi naziv grada i prikaži sve punjače
✅ Detalji punjača - Klik na marker prikazuje detalje (adresa, broj priključaka, itd.)
✅ Sync OCM - Dugme za sinhronizaciju podataka sa Open Charge Map API-ja 

