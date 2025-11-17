all: run

run:
	npm run dev

init:
	sudo docker start pgdb

migrate:
	node ace migration:run

reset: # excludes everything from the database and runs the migration
	sudo docker exec -it pgdb psql -U root -d postgres -c "DROP DATABASE app;"
	sudo docker exec -it pgdb psql -U root -d postgres -c "CREATE DATABASE app;"
	node ace migration:run

seed:
	rm -rf seedContent
	mkdir seedContent
	curl -L -o ./seedContent/zara-dataset-men-and-women-clothing.zip https://www.kaggle.com/api/v1/datasets/download/abhinavtyagi2708/zara-dataset-men-and-women-clothing
	unzip ./seedContent/zara-dataset-men-and-women-clothing.zip -d ./seedContent/
	node merge_csv.cjs
	node ace db:seed