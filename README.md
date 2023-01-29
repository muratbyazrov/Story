## Story-System

- Story-System (далее SS) - легковесный фреймворк на базе *express.js* для быстрого создания приложений на *Node.js*
- Работает с протоколами http, websocket, с брокером сообщений rabbitMQ и с базой данных Postgres
- Использует доменно-событийную модель


### Оглавление

- [Файловая структура проекта](#Файловая-структура-проекта)
  - [Вспомогательные файлы](#Вспомогательные-файлы)
  - [Конфигурационный файл](#Конфигурационный-файл)
  - [Корневой файл проекта](#Корневой-файл-проекта)
      - [controller](#controller)
      - [service](#service)
      - [schema](#schema)
      - [queries](#queries)
- [Основные модули SS](#)
  - [gate](gate)
  - [http-adapter](http-adapter)
  - [ws-adapter](ws-adapter)
  - [rmq-adapter](rmq-adapter)
  - [db-adapter](db-adapter)
  - [validator](validator)
  - [logger](logger)


#### Файловая структура проекта
Рассмотрим файловую структуру базового проекта на примере приложения cats-application

```
cats-application
|
|__src (Основная рабочая директория)
|   |__db (Директория для работы модуля db-migrate)
|   |   |__migrations (Список миграций)
|   |   |      |__sqls
|   |   |           |__up-migration.sql (SQL-запрос для накатывания миграции)
|   |   |           |__down-migrations.sql (SQL-запрос для отката миграции)
|   |   |__index.js (Исполняемы скрипт миграции)
|   |   |
|   |   |__database.json (Настройки, для подключения db-migrate к базе данных)
|   |
|   |__entities (сущности приложения)
|        |__cats (методы сущности cats)
|            |
|            |__cats-controller.js (Валидирует и предобрабатывает запросы. См ниже пример)
|            |__cats-service.js (Основная логика метода. См ниже пример)
|            |__queries.js (SQL-запросы, необходимые для метода. См ниже пример)
|            |_schemas.js (Валидация. См ниже пример)
|
|__.eslintrc
|__.gitignore
|__app.js (Корневой файл приложения. См пример ниже)
|__config.js (Конфигурационный файл приложения. См пример ниже)
|__package.json
   ```

Рассмотрим подробно каждый элемент

##### Вспомогательные файлы
  - .eslintrc
  - .gitignore
  - package.json

##### Конфигурационный файл
```JS
// config.js
 module.exports = {
  db: {
    user: 'user-name',
    host: '127.10.10.11',
    database: 'se',
    schema: 'database-schema',
    password: 'test',
    port: 5432,
  },
  http: {
    host: '192.168.236.109',
    port: 3001,
    path: '/path/v1',
  },
  ws: {
    host: '192.168.236.109',
    port: 9001,
  },
  rmq: {
    host: '192.168.236.109',
    port: 9001,
  },
  token: {
   key: 'token-key',
   expired: '',
  },
};
```

##### Корневой файл проекта
```JS
// app.js
const {Story} = require('story-system');
const config = require('./config.js');
const {CatsController} = require('./src/entities/cats/cats-controller.js');

class App {
    constructor() {
      Story.gateInit(config, [
        {EntityController: CatsController, domain: 'cats'},
      ]);
        
      Story.adaptersInit(config);
    }
}

new App();
```

##### controller
```JS
// cats-controller.js
const {Story} = require('story-system');
const {getCatsSchema} = require('./schemas.js');
const {CatsService} = require('./cats-service');

class CatsController {
  constructor() {
    this.accountsService = new CatsService();
  }

  getCats(data) {
    Story.validator.validate(data, getCatsSchema);
    return this.accountsService.getCats(data);
  }
}

module.exports = {CatsController};
```

##### service
```JS
// cats-service.js
const {Story} = require('story-system');
const {getCats} = require('./queries.js');

class CatsService {
  getCats(data) {
    return Story.dbAdapter.execQuery({
      queryName: getCats,
      params: data.params,
    });
  }
}

module.exports = {CatsService};
```

##### schema
```JS
// schema.js
const {Story: {validator: {schemaItems: {string, number, limit}}}} = require('story-system');

const getCatsSchema = {
  id: 'getCatsSchema',
  type: 'object',
  additionalItems: true,
  properties: {
    params: {
      type: 'object',
      properties: {
        limit,
        accountId: string,
        login: string,
        password: string,
      },
      required: ['limit', 'login', 'password'],
    },
  },
  required: ['params'],
};

module.exports = {
  getCatsSchema,
};
```

##### queries
```JS
// queries.js
module.exports = {
  getCats: `
        SELECT
             cat_id AS "catId"
            ,cat_name AS "catName"
        FROM
            cats AS c
        WHERE
            TRUE
            /*catId: AND cat_id = :catId*/
        /*offset: OFFSET :offset*/
        LIMIT :limit;`,
};
```
  

## gate
Все запросы (http, ws, rmq) идут через gate.

- Конструирует объект `controllers`, состоящий из пар {`<domain>`: `<controller>`} 
(Домен и контроллер регистрируются в корневом файле проекта `app.js`)
- Выполняет первичную валидацию запроса (на наличие в запросе параметров `domain` и`event`)
  - Приводит запрос к объекту *JavaScript*
  - Проверяет выданный токен. Если токен не валидный, возвращает ответ с ошибкой
  - Проверяет, существует ли `domain`. Если `domain` не существует, возвращает ответ с ошибкой.
  - Проверяет, существует ли метод (`event`). Если метод не существует, возвращает ответ с ошибкой.
- Выполняет запрос, обращаясь к нужному контроллеру, а затем к нужному методу контроллера 
(`controllers[data.domain][data.event](data)`, где `data` - это тело запроса
- Приводит ответ к системному ответу
- Возвращает ответ

*Примечание*. Если вы задаетесь вопросом, как запросы попадают в `gate`, то обратите внимание
на [корневой](index.js) файл проекта, метод `adaptersInit`. Здесь видно, что при получении запроса все 
адаптеры колбэком вызывают метод `gate.run()`
