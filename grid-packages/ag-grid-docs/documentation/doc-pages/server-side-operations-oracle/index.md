---
title: "Server-Side Operations With Java & Oracle"
enterprise: true
---

Learn how to perform server-side operations using the Oracle Database with a complete reference implementation.


In this guide we will show how large datasets, which are too big be loaded directly into the browser, can be managed by performing server-side operations inside the Oracle database.


We will develop a financial reporting application that demonstrates how data can be lazy-loaded as required, even when performing group, filter, sort and pivot operations.

<warning>
The reference implementation covered in this guide is for demonstration purposes only. If you use this in production it comes with no warranty or support.
</warning>

The source code can be found here: [https://github.com/ag-grid/ag-grid-server-side-oracle-example](https://github.com/ag-grid/ag-grid-server-side-oracle-example)


## Overview

When designing a grid based application, one of the key considerations is how much data needs to be sent from the server to the client. As a developer using AG Grid you won't need to switch between grids based on the answer to this question, instead just select the appropriate Row Model used by the grid.

### Client-Side Row Model

The simplest approach is to send all row data to the browser in response to a single request at initialisation. For this use case the [Client-Side Row Model](/client-side-model/) has been designed.

This scenario is illustrated below where 10,000 records are loaded directly into the browser:

<image-caption src="server-side-operations-oracle/resources/in-memory-row-model.png" alt="In Memory Row Model" constrained="true" filterdarkmode="true"></image-caption>

The Client-Side Row Model only renders the rows currently visible, so the upper limit of rows is governed by the browser's memory footprint and data transfer time, rather than any restrictions inside the grid.

### Server-Side Row Model

However many real world applications contain much larger datasets, often involving millions of records. In this case it simply isn't feasible to load all the data into the browser in one go. Instead data will need to be lazy-loaded as required and then purged to limit the memory footprint in the browser.

This is precisely the problem the [Server-Side Row Model](/server-side-model/) addresses, along with delegating server-side operations such as filtering, sorting, grouping and pivoting.

The following diagram shows the approach used by the Server-Side Row Model. Here there are 10 million records, however the number of records is only constrained by the limits of the server:

<image-caption src="server-side-operations-oracle/resources/enterprise-row-model.png" alt="Enterprise Row Model" constrained="true" filterdarkmode="true"></image-caption>

As the user performs operations such as sorting and grouping, the grid issues requests to the server that contains all the necessary metadata required, including which portion of data should be returned based on the user's position in the dataset.

The browser will never run out of heap space as the grid will automatically purge out-of-range records.

Throughout the rest of this guide we will demonstrate the power of the Server-Side Row Model with the aid of a Java service connected to an Oracle database.

## Prerequisites

It is assumed the reader is already familiar with Java, Maven, Spring Boot and Oracle.

This example was tested using the following versions:

- ag-grid-enterprise (v18.0.0)
- Java(TM) SE Runtime Environment (build 1.8.0_162-b12)
- Java HotSpot(TM) 64-Bit Server VM (build 25.162-b12, mixed mode)
- Apache Maven (3.5.2)
- Oracle 12c Release 2 (12.2.0.1)
- Oracle JDBC Driver (ojdbc7-12.1.0.2)


Due to Oracle license restrictions the Oracle JDBC driver is not available in the public Maven repository and should be manually installed into your local Maven repository like so:

```bash
mvn install:install-file -Dfile={Path/to/ojdbc7.jar} -DgroupId=com.oracle -DartifactId=ojdbc7 -Dversion=12.1.0.2 -Dpackaging=jar
```

Also ensure the Oracle JDBC driver version also matches the Oracle POM dependency:

```xml
// pom.xml

<dependency>
    <groupId>com.oracle</groupId>
    <artifactId>ojdbc7</artifactId>
    <version>12.1.0.2</version>
</dependency>
```

## Download and Install

Clone the example project using:

```bash
git clone https://github.com/ag-grid/ag-grid-server-side-oracle-example.git
```

Navigate into the project directory:

```bash
cd ag-grid-server-side-oracle-example
```

Install project dependencies and build project using:

```bash
mvn clean install
```

To confirm all went well you should see the following maven output:

<image-caption src="server-side-operations-oracle/resources/mvn-success.png" alt="MVN Success" constrained="true" filterdarkmode="true"></image-caption>

## Configure Oracle

Update the Oracle configuration accordingly with your database connection details:

```bash
// src/main/resources/application.properties

spring.datasource.url=jdbc:oracle:thin:@//localhost:1521/orcl
spring.datasource.username=system
spring.datasource.password=oracle
```

## Setup Data

Run the following script in Oracle to create the table required in this example:

```sql
/* src/main/resources/schema.sql */

CREATE TABLE trade
(
    product VARCHAR(255),
    portfolio VARCHAR(255),
    book VARCHAR(255),
    tradeId NUMBER,
    submitterId NUMBER,
    submitterDealId NUMBER,
    dealType VARCHAR(255),
    bidType VARCHAR(255),
    currentValue NUMBER,
    previousValue NUMBER,
    pl1 NUMBER,
    pl2 NUMBER,
    gainDx NUMBER,
    sxPx NUMBER,
    x99Out NUMBER,
    batch NUMBER
);
```

Next run the following utility to populate it with data:

`src/test/java/com/ag/grid/enterprise/oracle/demo/TradeDataLoader.java`

## Run the App

From the project root run:

```bash
mvn spring-boot:run
```

If successful you should see something like this:

<image-caption src="server-side-operations-oracle/resources/tomcat-started.png" alt="TomCat Started" constrained="true" filterdarkmode="true"></image-caption>

To test the application point your browser to [http://localhost:9090](http://localhost:9090)

## Server-Side Row Model Interfaces

Our Java service will use the following request and response objects:

```java
// src/main/java/com/ag/grid/enterprise/oracle/demo/request/ServerSideGetRowsRequest.java

public class ServerSideGetRowsRequest implements Serializable {

    private int startRow, endRow;

    // row group columns
    private List<ColumnVO> rowGroupCols;

    // value columns
    private List<ColumnVO> valueCols;

    // pivot columns
    private List<ColumnVO> pivotCols;

    // true if pivot mode is on, otherwise false
    private boolean pivotMode;

    // what groups the user is viewing
    private List<String> groupKeys;

    // if filtering, what the filter model is
    private Map<String, ColumnFilter> filterModel;

    // if sorting, what the sort model is
    private List<SortModel> sortModel;

    ...
}
```

```java
// src/main/java/com/ag/grid/enterprise/oracle/demo/response/ServerSideGetRowsResponse.java

public class ServerSideGetRowsResponse {

    private List<Map<String, Object>> data;

    private int lastRow;

    private List<String> pivotResultColumnsFields;

    ...
}
```

We will discuss these in detail throughout this guide, however for more details see: [Server-Side Datasource](/server-side-model-datasource/)


## Service Controller

Our service shall contain a single endpoint `/getRows` with the request and response objects defined above:


```java
// src/main/java/com/ag/grid/enterprise/oracle/demo/controller/TradeController.java

@RestController
public class TradeController {

    private TradeDao tradeDao;

    @Autowired
    public TradeController(@Qualifier("tradeDao") TradeDao tradeDao) {
        this.tradeDao = tradeDao;
    }

    @RequestMapping(method = POST, value = "/getRows")
    @ResponseBody
    public ServerSideGetRowsResponse getRows(@RequestBody ServerSideGetRowsRequest request) {
        return tradeDao.getData(request);
    }
}
```

The `TradeController` makes use of the [Spring Controller](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller.html) to handle HTTP and JSON Serialisation.


## Data Access

The `OracleSqlQueryBuilder` dynamically generates SQL based on the supplied request. We will query the `Trade` table with our generated SQL using the [Spring JDBC Template](https://docs.spring.io/spring-framework/reference/data-access.html).

Here is the implementation of our `TradeDao`:


```java
// src/main/java/com/ag/grid/enterprise/oracle/demo/dao/TradeDao.java

@Repository("tradeDao")
public class TradeDao {

    private JdbcTemplate template;
    private OracleSqlQueryBuilder queryBuilder;

    @Autowired
    public TradeDao(JdbcTemplate template) {
        this.template = template;
        queryBuilder = new OracleSqlQueryBuilder();
    }

    public ServerSideGetRowsResponse getData(ServerSideGetRowsRequest request) {
        String tableName = "trade"; // could be supplied in request as a lookup key?

        // first obtain the pivot values from the DB for the requested pivot columns
        Map<String, List<String>> pivotValues = getPivotValues(request.getPivotCols());

        // generate SQL
        String sql = queryBuilder.createSql(request, tableName, pivotValues);

        // query DB for rows
        List<Map<String, Object>> rows = template.queryForList(sql);

        // create response with our results
        return createResponse(request, rows, pivotValues);
    }

    private Map<String, List<String>> getPivotValues(List<ColumnVO> pivotCols) {
        return pivotCols.stream()
            .map(ColumnVO::getField)
            .collect(toMap(
                pivotCol -> pivotCol, this::getPivotValues, (a, b) -> a, LinkedHashMap::new));
    }

    private List<String> getPivotValues(String pivotColumn) {
        String sql = "SELECT DISTINCT %s FROM trade";
        return template.queryForList(format(sql, pivotColumn), String.class);
    }
}
```

## Filtering

Our example will make use of the grid's `NumberFilter` and `SetFilter` [Column Filters](/filtering/). The corresponding server-side classes are as follows:

```java
// src/main/java/com/ag/grid/enterprise/oracle/demo/filter/NumberColumnFilter.java

public class NumberColumnFilter extends ColumnFilter {
    private String type;
    private Integer filter;
    private Integer filterTo;
    ...
}
```

```java
// src/main/java/com/ag/grid/enterprise/oracle/demo/filter/SetColumnFilter.java

public class SetColumnFilter extends ColumnFilter {
    private List<String> values;
    ...
}
```

These filters are supplied per column in the `ServerSideGetRowsRequest` via the following property:

```java
Map<String, ColumnFilter> filterModel;
```

As these filters differ in structure it is necessary to perform some specialised deserialisation using the Type Annotations provided by the [Jackson Annotations](https://github.com/FasterXML/jackson-annotations) project.


When the `filterModel` property is deserialised, we will need to select the appropriate concrete `ColumnFilter` as shown below:


```java
// src/main/java/com/ag/grid/enterprise/oracle/demo/filter/ColumnFilter.java

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "filterType")
@JsonSubTypes({
    @JsonSubTypes.Type(value = NumberColumnFilter.class, name = "number"),
    @JsonSubTypes.Type(value = SetColumnFilter.class, name = "set") })
public abstract class ColumnFilter {
    String filterType;
}
```

Here we are using the `filterType` property to determine which concrete filter class needs to be associated with the `ColumnFilter` entries in the `filterModel` map.

## Sorting

The `ServerSideGetRowsRequest` contains the following attribute to determine which columns to sort by:


```java
private List<SortModel> sortModel;
```

The `SortModel` contains the `colId` (i.e. 'book') and the `sort` type (i.e. 'asc')


```java
// src/main/java/com/ag/grid/enterprise/oracle/demo/request/SortModel.java

public class SortModel implements Serializable {
    private String colId;
    private String sort;
    ...
}
```

The OracleSqlQueryBuilder then appends accordingly to the `ORDER BY` clause:

```java
// src/main/java/com/ag/grid/enterprise/oracle/demo/builder/OracleSqlQueryBuilder.java

orderByCols.isEmpty() ? "" : " ORDER BY " + join(",", orderByCols);
```

## Grouping

Grouping is easily achieved in the `OracleSqlQueryBuilder` by appending `rowGroups` to the `GROUP BY` like so:


```java
// src/main/java/com/ag/grid/enterprise/oracle/demo/builder/OracleSqlQueryBuilder.java

private String groupBySql() {
    return isGrouping ? " GROUP BY " + join(", ", rowGroupsToInclude) : "";
}

private List<String> getRowGroupsToInclude() {
    return rowGroups.stream()
        .limit(groupKeys.size() + 1)
        .collect(toList());
}
```

## Pivoting

In order to perform pivoting we will use the `OracleSqlQueryBuilder` to generate a series of decode statements for each combination of pivot and value columns, such as:


```sql
sum (
     DECODE(DEALTYPE, 'Financial', DECODE(BIDTYPE, 'Buy', CURRENTVALUE))
) "Financial_Buy_CURRENTVALUE"
```

These new pivot result columns are created using the row values contained in the data and have field names such as: `Financial_Buy_CURRENTVALUE`.


These will need to be returned to the grid in the `ServerSideGetRowsResponse` in the following property:


```java
List<String> pivotResultColumnsFields;
```

Our client code will then use these secondary column fields to generate the corresponding `ColDefs` like so:

```js
// src/main/resources/static/main.js

let createPivotResultColumns = function (fields, valueCols) {
    let pivotResultCols = [];

    function addColDef(colId, parts, res) {
        if (parts.length === 0) return [];

        let first = parts.shift();
        let existing = res.find(r => r.groupId === first);

        if (existing) {
            existing['children'] = addColDef(colId, parts, existing.children);
        } else {
            let colDef = {};
            let isGroup = parts.length > 0;

            if (isGroup) {
                colDef['groupId'] = first;
                colDef['headerName'] = first;
            } else {
                let valueCol = valueCols.find(r => r.field === first);

                colDef['colId'] = colId;
                colDef['headerName'] =  valueCol.displayName;
                colDef['field'] = colId;
                colDef['type'] = 'measure';
            }

            let children = addColDef(colId, parts, []);
            children.length > 0 ? colDef['children'] = children : null;

            res.push(colDef);
        }

        return res;
    }

    fields.sort();
    fields.forEach(field => addColDef(field, field.split('_'), pivotResultCols));

    return pivotResultCols;
};
```

In order for the grid to show these newly created columns an explicit API call is required:


```js
api.setPivotResultColumns(pivotResultColDefs);
```

## Infinite Scrolling

The `ServerSideGetRowsRequest` contains the following attribute to determine the range to return:

```js
private int startRow, endRow;
```

The `OracleSqlQueryBuilder` uses this information when limiting the results as follows:


```java
// src/main/java/com/ag/grid/enterprise/oracle/demo/builder/OracleSqlQueryBuilder.java

private String limitSql() {
    return " OFFSET " + startRow + " ROWS FETCH NEXT " + (endRow - startRow + 1) + " ROWS ONLY";
}
```

## Conclusion

In this guide we presented a reference implementation for integrating the Server-Side Row Model with a Java service connected to an Oracle database. This included all necessary configuration and install instructions.

A high level overview was given to illustrate the problem this approach solves before providing details of how to achieve the following server-side operations:

- Filtering
- Sorting
- Grouping
- Pivoting
- Infinite Scrolling

