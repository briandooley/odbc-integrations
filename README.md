odbc-integrations
=================

ODBC Integration with Oracle and Mongo


Setup
-----

### Oracle
1. If you do not already have an oracle database available, you will need to set one up. The easiest way to do this is via an Amazon RDS instance.

2. DB Schema

		CREATE TABLE "FEEDHENRY"."BASEBALL_TEAM" 
		(
			"TEAM" VARCHAR2(50 BYTE), 
			"STADIUM" VARCHAR2(50 BYTE), 
			"WEB_SITE" VARCHAR2(50 BYTE), 
			"LEAGUE" VARCHAR2(2 BYTE), 
			"LAST_WORLD_SERIES_WIN" VARCHAR2(10 BYTE)
		);

		Insert into FEEDHENRY.BASEBALL_TEAM 			(TEAM,STADIUM,WEB_SITE,LEAGUE,LAST_WORLD_SERIES_WIN) 
		values ('Arizona Diamondbacks','Chase Field','dbacks.com','NL','2001');
		
3. Environment Variables

The following [environment valriables](http://docs.feedhenry.com/v2/environment_variables.html) will need to be configured to use the database.

	ORACLE_DATABASE = <database name>
	ORACLE_HOSTNAME = <hostname of oracle DB>
	ORACLE_PASSWORD = <password for oracle db user>
	ORACLE_PORT = 1521
	ORACLE_TABLE = BASEBALL_TEAM
	ORACLE_USER = <username for oracle db user>


4. SQL Developer

It is useful to be able to query the database using a graphical SQL client. SQL Developer is the recommended tool: 
http://www.oracle.com/technetwork/developer-tools/sql-developer/downloads/index.html
Connection Settings


### MongoDB

1. If you do not already have a mongo database available, you will need to set one up. The easiest way to do this is via a hosted mongo service like [mongohq](https://www.mongohq.com) or [mongolabs](https://mongolab.com)

2. DB Schema (ish)

		{
  			"Team": "Chicago White Sox",
  			"Stadium": "U.S. Cellular Field",
  			"Web Site": "whitesox.com",
  			"League": "AL",
  			"Last World Series Win": "2005",
  			"_id": "51b72b864e8c0e8a27000003"
		}

3. Environment Variable

	The following [environment valriables](http://docs.feedhenry.com/v2/environment_variables.html) will need to be configured to use the database.

	
		MONGODB_COLLECTION = baseball_teams
		MONGODB_DATABASE = fhmongodb
		MONGODB_HOSTNAME = <hostname of mongo db>
		MONGODB_PASSWORD = <mongo password>
		MONGODB_PORT = 27017
		MONGODB_USER = <mongo username>

4. Mongo Shell

	It is useful to be able to query the database directly. The mongo client command line shell is useful for this. Install from [mongodb](http://www.mongodb.org/downloads) directly.
The following commands can be used to access:

		mongo <hostname of mongo db>
		use fhmongodb
		db.auth('<mongo username>', '<mongo password>')
		show collections
		db.baseball_teams.count();


## FHC Act Calls

The ODBC connectvity is most easily tested using the FeedHenry command line tool [FHC](http://docs.feedhenry.com/v2/fhc_command_line_tool.html)

1. Target/Login

		fhc target <FeedHenry domain name>
		fhc login <username / password> <password>

2. List all Oracle entries (Primed with National League Baseball Teams - 15)

		fhc act 0uD0jit-1C5-cWzxROyMHol0 selectOracle
		[{
 			 "TEAM": "Arizona Diamondbacks",
 			 "STADIUM": "Chase Field",
			  "WEB_SITE": "dbacks.com",
			  "LEAGUE": "NL",
			  "LAST_WORLD_SERIES_WIN": "2001"
		},.....]

3. List all MongoDB entries (Primed with American League Baseball Teams - 15)

		fhc act 0uD0jit-1C5-cWzxROyMHol0 selectMongoDB
		[{
  			"Team": "Baltimore Orioles",
  			"Stadium": "Oriole Park",
  			"Web Site": "orioles.com",
  			"League": "AL",
  			"Last World Series Win": "1983",
  			"_id": "51b72b864e8c0e8a27000001"
		},....]

4. Import JSON list of teams into Oracle

		fhc act 0uD0jit-1C5-cWzxROyMHol0 importMongoDB '{"list":<contents of cloud/baseball_teams_nl.min.json>}'

	i.e.
			
		fhc act 0uD0jit-1C5-cWzxROyMHol0 importOracle '{"list":[{"Team":"Arizona Diamondbacks","Stadium":"Chase Field","Web Site":"dbacks.com","League":"NL","Last World Series Win":"2001"},{"Team":"Atlanta Braves","Stadium":"Turner Field","Web Site":"braves.com","League":"NL","Last World Series Win":"1995"},{"Team":"Chicago Cubs","Stadium":"Wrigley Field","Web Site":"cubs.com","League":"NL","Last World Series Win":"1908"},{"Team":"Cincinnati Reds","Stadium":"Great American Ball Park","Web Site":"reds.com","League":"NL","Last World Series Win":"1990"},{"Team":"Colorado Rockies","Stadium":"Coors Field","Web Site":"Rockies.com","League":"NL","Last World Series Win":"-"},{"Team":"Los Angeles Dodgers","Stadium":"Dodger Stadium","Web Site":"dodgers.com","League":"NL","Last World Series Win":"1988"},{"Team":"Miami Marlins","Stadium":"Marlins Park","Web Site":"marlins.com","League":"NL","Last World Series Win":"2003"},{"Team":"Milwaukee Brewers","Stadium":"Miller Park","Web Site":"brewers.com","League":"NL","Last World Series Win":"-"},{"Team":"New York Mets","Stadium":"Citi Field","Web Site":"mets.com","League":"NL","Last World Series Win":"1986"},{"Team":"Philadelphia Phillies","Stadium":"Citizens Bank Park","Web Site":"phillies.com","League":"NL","Last World Series Win":"2008"},{"Team":"Pittsburgh Pirates","Stadium":"PNC Park","Web Site":"pirates.com","League":"NL","Last World Series Win":"1979"},{"Team":"San Diego Padres","Stadium":"PETCO Park","Web Site":"padres.com","League":"NL","Last World Series Win":"-"},{"Team":"San Francisco Giants","Stadium":"AT&T Park","Web Site":"SFGiants.com","League":"NL","Last World Series Win":"2012"},{"Team":"St. Louis Cardinals","Stadium":"Busch Stadium","Web Site":"cardinals.com","League":"NL","Last World Series Win":"2011"},{"Team":"Washington Nationals","Stadium":"Nationals Park","Web Site":"nationals.com","League":"NL","Last World Series Win":"-"}]}'


5. Import JSON list of teams into MongoDB

		fhc act 0uD0jit-1C5-cWzxROyMHol0 importMongoDB '{"list":<contents of cloud/baseball_teams_al.min.json>}'

	i.e.


		fhc act 0uD0jit-1C5-cWzxROyMHol0 importMongoDB '{"list":[{"Team":"Baltimore Orioles","Stadium":"Oriole Park","Web Site":"orioles.com","League":"AL","Last World Series Win":"1983"},{"Team":"Boston Red Sox","Stadium":"Fenway Park","Web Site":"redsox.com","League":"AL","Last World Series Win":"2007"},{"Team":"Chicago White Sox","Stadium":"U.S. Cellular Field","Web Site":"whitesox.com","League":"AL","Last World Series Win":"2005"},{"Team":"Cleveland Indians","Stadium":"Progressive Field","Web Site":"indians.com","League":"AL","Last World Series Win":"1948"},{"Team":"Detroit Tigers","Stadium":"Comerica Park","Web Site":"tigers.com","League":"AL","Last World Series Win":"1984"},{"Team":"Houston Astros","Stadium":"Minute Maid Park","Web Site":"astros.com","League":"AL","Last World Series Win":"-"},{"Team":"Kansas City Royals","Stadium":"Kauffman Stadium","Web Site":"royals.com","League":"AL","Last World Series Win":"1985"},{"Team":"Los Angeles Angels","Stadium":"Angel Stadium","Web Site":"angels.com","League":"AL","Last World Series Win":"2002"},{"Team":"Minnesota Twins","Stadium":"Target Field","Web Site":"twinsbaseball.com","League":"AL","Last World Series Win":"1991"},{"Team":"New York Yankees","Stadium":"Yankee Stadium","Web Site":"yankees.com","League":"AL","Last World Series Win":"2009"},{"Team":"Oakland Athletics","Stadium":"O.co Coliseum","Web Site":"oaklandathletics.com","League":"AL","Last World Series Win":"1989"},{"Team":"Seattle Mariners","Stadium":"Safeco Field","Web Site":"Mariners.com","League":"AL","Last World Series Win":"-"},{"Team":"Tampa Bay Rays","Stadium":"Tropicana Field","Web Site":"raysbaseball.com","League":"AL","Last World Series Win":"-"},{"Team":"Texas Rangers","Stadium":"Rangers Ballpark in Arlington","Web Site":"texasrangers.com","League":"AL","Last World Series Win":"-"},{"Team": "Toronto Blue Jays","Stadium": "Rogers Centre","Web Site": "bluejays.com","League": "AL","Last World Series Win":"1993"}]}'


6. Copy MongoDB collection to Oracle DB Table

		fhc act 0uD0jit-1C5-cWzxROyMHol0 copyMongoDBToOracle


7. Copy Oracle DB Table rows to MongoDB collection

		fhc act 0uD0jit-1C5-cWzxROyMHol0 copyOracleToMongoDB


## Stats

[Stats](http://docs.feedhenry.com/v2/stats.html) are available for the following operations:

### Mongo Timer Stats

- mongo_open_time = Open connection to mongodb
- mongo_insert_time = Insert 1 or more documents into collection
- mongo_find_time = Find all documents in collection
- mongo_query_time = Find and Insert combined


### Oracle Timer Stats

- oracle_connect_time = Connect to Oracle
- oracle_insert_time = Insert 1 row into table (called in a loop for adding multiple rows)
- oracle_select_time = Select all rows in table
- oracle_execute_time = Insert and Select combined
