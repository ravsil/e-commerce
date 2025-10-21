all: run

run:
	npm run dev

migrate:
	node ace migration:run

reset: # excludes everything from the database and runs the migration
	sudo docker exec -it pgdb psql -U root -d postgres -c "DROP DATABASE app;"
	sudo docker exec -it pgdb psql -U root -d postgres -c "CREATE DATABASE app;"
	node ace migration:run
