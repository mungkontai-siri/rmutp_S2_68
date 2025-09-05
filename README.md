# Python Prisma

Mungkontai Siriworapan (KORN)

## Using it
``` bash  
copy env.simple .env
docker compose -f db.yml up -d
``` 

## Prisma
### First time
```bash
npx prisma generate
npx prisma db push
````

## Operation
```bash
npx prisma studio
`````