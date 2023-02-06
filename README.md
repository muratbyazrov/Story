## Story

- Story - легковесный фреймворк на базе *express.js* для быстрого создания приложений на *Node.js*
- Работает с протоколами http, websocket, с брокером сообщений rabbitMQ и с клиентом БД - PostgreSQL
- Использует доменно-событийную модель


### Оглавление

- [Файловая структура проекта](#Файловая-структура-проекта)
  - [Вспомогательные файлы](#Вспомогательные-файлы)
  - [Конфигурационный файл](#Конфигурационный-файл)
  - [Корневой файл проекта](#Корневой-файл-проекта)
  - [Для работы с сущностью](#Для-работы-с-сущностью)
    - [controller](#controller)
    - [service](#service)
    - [queries](#queries)
    - [schema](#schema)
- [Пример запроса](#Пример-запроса)
- [Пример ответа](#Пример-ответа)
- [Работа с токеном](#Работа-с-токеном)
- [Ошибки](#Ошибки)
- [Основные модули Story](#Основные-модули-Story)
  - [gate](gate)
  - [http-adapter](http-adapter)
  - [ws-adapter](ws-adapter)
  - [rmq-adapter](rmq-adapter)
  - [db-adapter](db-adapter)
  - [validator](validator)
  - [logger](logger)


### Файловая структура проекта
Вот файловая структура базового проекта на примере приложения cats-application, а далее
рассмотрим каждый элемент подробнее

```
cats-application
|
|__src (Основная рабочая директория)
|   |__db (Директория для работы модуля db-migrate)
|   |   |__migrations (Список миграций)
|   |   |      |__sqls
|   |   |           |__up-migration.sql (SQL-запрос для накатывания миграции)
|   |   |           |__down-migrations.sql (SQL-запрос для отката миграции)
|   |   |__index.js (Исполняемый скрипт миграции)
|   |   |
|   |   |__database.json (Настройки, для подключения db-migrate к базе данных)
|   |
|   |__entities (Сущности приложения)
|        |__cats (Методы сущности cats)
|            |
|            |__cats-controller.js (Валидирует и предобрабатывает запросы. См ниже пример)
|            |__cats-service.js (Основная логика метода. См ниже пример)
|            |__queries.js (SQL-запросы, необходимые для метода. См ниже пример)
|            |__schemas.js (Валидация. См ниже пример)
|
|__.eslintrc
|__.gitignore
|__app.js (Корневой файл приложения. См пример ниже)
|__config.js (Конфигурационный файл приложения. См пример ниже)
|__package.json
   ```

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
    enabled: true,
    expiresIn: 100000,
    uncheckMethods: {
        domain_1: "event_1",
        domain_1: "event_2"
    }
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

### Для работы с сущностью

##### controller
Валидирует и предобрабатывает запросы. В общем, вся логика, не относящаяся к бизнес-логике. <br>
Каждый контроллер принимает два параметра:
- data - *object* - тело запроса
- tokenData - *object* - данные, которые были переданы при генерации (смотрите подробнее раздел "Работа с токеном") 
токена. Таким образом можно извлечь эти данные и использовать их в запросе
```JS
// cats-controller.js
const {Story} = require('story-system');
const {getCatsSchema} = require('./schemas.js');
const {CatsService} = require('./cats-service');

class CatsController {
  constructor() {
    this.accountsService = new CatsService();
  }

  getCats(data, tokenData) {
    Story.validator.validate(data, getCatsSchema);
    const {catId} = tokenData;
    console.log('${catId} - это id кота, который был передан в функцию `genetateToken` при генерации токена');
    return this.accountsService.getCats(data);
  }
}

module.exports = {CatsController};
```

##### service
Основная бизнес-логика метода
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

##### queries
SQL-запросы, необходимые для метода
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

##### schema
Схема валидации
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

### Пример запроса
Вне зависимости от протокола (http, ws или rmq) запрос должен имеет один и тот же вид:

```JSON
{
  "domain": "cats",
  "event": "getCats",
  "params": {
    "limit": 5
  },
  "token": ""
}
```

*Примечание* <br>
По http всегда принимается POST-запрос. Не используйте GET, UPDATE и так далее

### Пример ответа
Успешный ответ

```JSON
{
  "domain": "cats",
  "event": "getCats",
  "data": [
    {
      "catId": 1,
      "catName": "Scot"
    }
  ]
}
```

Ответ с ошибкой
```JSON
{
    "domain": "cats",
    "event": "getCats",
    "error": [{
      "code":  403,
      "name":  "Forbidden",
      "message":  "error message"
    }]
}
```

### Ошибки
Ошибка базы данных
```json
{
  "code":  900,
  "name":  "Data Base Error",
  "message":  "error message"
}
```

Ошибка валидации
```json
{
  "code":  400,
  "name":  "Validation error",
  "message":  "error message"
}
```

Ошибка доступа
```json
{
  "code":  403,
  "name":  "Forbidden",
  "message":  "error message"
}
```

Ошибка NotFound
```json
{
  "code":  404,
  "name":  "Not Found",
  "message":  "error message"
}
```


## Работа с токеном
Рассмотрим ещё раз конфигурационный файл и в нем настройку работы с токеном:
```js
{
  token: {
    enabled: true,
    expiresIn: '',
    uncheckMethods: {
        domain1: "event1",
        domain1: "event2"
    }
  },
}
```
Давайте разберем подробнее каждую настройку:
- `enabled`- *boolean* - если true, то у всех запросов будет проверяться токен
- `expiresIn`- *number* - время жизни токена в миллисекундах. По умолчанию 24 часа Рефреш токена будет реализован в след. версиях
- `uncheckMethods`- *object* - Объект ключами которого являются домены (`domain`), а значениями методы (`event`). Для
этих методов токен не будет проверяться, даже если будет включен флаг enabled. Обратная логика будет реализована в след.
версиях

Пример авторизации, с генерацией и возвращением токена
```js
    signIn(data) {
        Story.validator.validate(data, signInSchema);
        const [cat] = await this.accountsService.getCats(data);
        if (!cat) {
            throw new Story.errors.Forbidden('Нет такого кота!');
        }

        return {token: await Story.token.generateToken(cat, {token})};
    }
```
Запрос
```json
{
    "domain": "cats",
    "event": "signIn",
    "params": {
        "login": "Jane",
        "password": "Jane"
    }
}
```
Ответ
```json
{
    "domain": "cats",
    "event": "signIn",
    "data": {
        "token": "very-long-token"
    }
}
```


## Основные модули Story

### gate
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
