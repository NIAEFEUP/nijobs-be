DROP TABLE IF EXISTS Action;
CREATE TABLE Action (
	id	 	INTEGER PRIMARY KEY AUTOINCREMENT,
	name	TEXT
);

DROP TABLE IF EXISTS Log;
CREATE TABLE Log (
	id	 	INTEGER PRIMARY KEY AUTOINCREMENT,
	actionId INTEGER REFERENCES Action(id),
	companyId INTEGER REFERENCES Company(id),
	timestamp	DATETIME,
	extrainfo	TEXT
);

DROP TABLE IF EXISTS Company;
CREATE TABLE Company (
	id	 	INTEGER PRIMARY KEY AUTOINCREMENT,
	name	TEXT,
	contacts	TEXT NOT NULL, -- Não seria melhor ter email e telefone e um dos dois ter de existir?
	bio		TEXT NOT NULL
);

DROP TABLE IF EXISTS ReportType;
CREATE TABLE ReportType (
	id	 	INTEGER PRIMARY KEY AUTOINCREMENT,
	name	TEXT
);

DROP TABLE IF EXISTS Report;
CREATE TABLE Report (
	id	 	INTEGER PRIMARY KEY AUTOINCREMENT,
	reportTypeId INTEGER REFERENCES ReportType(id),
	adId INTEGER REFERENCES Ad(id),
	reason	TEXT,
	reporterEmail TEXT
);

DROP TABLE IF EXISTS Ad;
CREATE TABLE Ad (
	id	 	INTEGER PRIMARY KEY AUTOINCREMENT,
	companyId INTEGER REFERENCES Company(id),
	jobTypeId INTEGER NOT NULL REFERENCES JobType(id),
	fieldId1 INTEGER NOT NULL REFERENCES Field(id),
	fieldId2 INTEGER NOT NULL REFERENCES Field(id),
	fieldId3 INTEGER REFERENCES Field(id),
	fieldId4 INTEGER REFERENCES Field(id),
	fieldId5 INTEGER REFERENCES Field(id),
	technologyId1 INTEGER NOT NULL REFERENCES Technology(id),
	technologyId2 INTEGER REFERENCES Technology(id),
	technologyId3 INTEGER REFERENCES Technology(id),
	technologyId4 INTEGER REFERENCES Technology(id),
	technologyId5 INTEGER REFERENCES Technology(id),
	technologyId6 INTEGER REFERENCES Technology(id),
	technologyId7 INTEGER REFERENCES Technology(id),
	cityId INTEGER REFERENCES City(id),
	title	TEXT,
	publishDate	DATETIME, -- endDate - publishDate >= 1 and <= 6
	endDate	DATETIME,
	jobDuration INTEGER, -- em que formato é que isto fica?
	jobStartDate	DATE,
	description	TEXT,
	contacts 	TEXT NOT NULL,
	isPaid	BOOLEAN,
	vacancies	INTEGER,
	isHidden	BOOLEAN
	
);

DROP TABLE IF EXISTS City;
CREATE TABLE City (
	id	 	INTEGER PRIMARY KEY AUTOINCREMENT,  
	countryId INTEGER REFERENCES Country(id),
	name 	TEXT
);

DROP TABLE IF EXISTS Country;
CREATE TABLE Country (
	id	 	INTEGER PRIMARY KEY AUTOINCREMENT,
	name 	TEXT
);

DROP TABLE IF EXISTS JobType;
CREATE TABLE JobType (
	id	 	INTEGER PRIMARY KEY AUTOINCREMENT,
	name 	TEXT
);

DROP TABLE IF EXISTS Field;
CREATE TABLE Field (
	id	 	INTEGER PRIMARY KEY AUTOINCREMENT,
	name 	TEXT
);

DROP TABLE IF EXISTS Technology;
CREATE TABLE Technology (
	id	 	INTEGER PRIMARY KEY AUTOINCREMENT,
	name 	TEXT
);






