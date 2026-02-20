## Story
<img src="./story.png" alt="Лого" width="350" height="350">

- Story - фреймворк на базе *express.js* для быстрого создания приложений на *Node.js*
- Работает с протоколами Http, Websockets, RabbitMQ
- Встроенный адаптер для PostgresSQL
- Работа с токенами
- Работа с файлами
- Логгирование
- Валидация
- Подходит для микросервисной архитектуры
- Использует доменно-событийную модель
- Легко расширяемые и модифицируемые модули для создания кастомных форков

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
- [Коммуникационные протоколы](#Коммуникационные-протоколы)
    - [http](#http)
    - [websockets](#websockets)
    - [rmq](#rmq)
- [Работа с БД](#Работа-с-бд)
- [Работа с токеном](#Работа-с-токеном)
- [Ошибки](#Ошибки)
- [Основные модули Story](#Основные-модули-Story)
    - [gate](#gate)
    - [http-adapter](#http-adapter)
    - [ws-adapter](#ws-adapter)
    - [rmq-adapter](#rmq-adapter)
    - [db-adapter](#db-adapter)
    - [files-adapter](#files-adapter)
    - [validator](#validator)
    - [logger](#logger)

### Файловая структура проекта

Вот файловая структура базового проекта на примере приложения cats-application, а далее рассмотрим каждый элемент
подробнее.

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
|            |__cats-service.js (Основная логика. См ниже пример)
|            |__queries.js (SQL-запросы. См ниже пример)
|            |__schemas.js (Схемы валидации. См ниже пример)
|
|__.eslintrc
|__.gitignore
|__app.js (Корневой файл приложения. См пример ниже)
|__config.development.js (Конфигурационный файл приложения для окружения develop. См пример ниже)
|__config.production.js (Конфигурационный файл приложения для окружения production. См пример ниже)
|__package.json
```

Базовый проект можно забрать [здесь](https://github.com/muratbyazrov/story-cats)

##### Вспомогательные файлы

- .eslintrc
- .gitignore
- package.json

##### Конфигурационный файл

Ниже показан дефолтная конфигурация.

- Работает это следующим образом:
    - Если в конфиге сервиса не указать, к примеру, ключ `db` - сервис вовсе не будет работать с базой данных
    - Если указать в конфиге сервиса ключ `db`, но ничего не указать внутри - сервис будет работать на дефолтных
      настройках `db`
    - Если указать в конфиге сервиса ключ `db`, а так же определить какие-то свойства, например, `host` - то в этом
      случае сервис будет работать на указанном `host`, а все остальные настройки для `db` будут дефолтные
- Так же можно создавать конфигурацию для конкретных окружений (тест, прод, стейдж). Окружение должно быть задано
  переменной окружения `NODE_ENV`. Тогда сервис возьмет конфигурационный файл с названием `config[NODE_ENV].js` (вы
  должны заранее создать такой файл). Переменную окружения можно задавать в package.json в скрипте, в docker-compose или
  где вам удобно.

```JS
module.exports = {
    db: {
        // https://node-postgres.com/apis/client
        user: 'db-story-user',
        host: 'postgres',
        password: 'test',
        port: 5432,
        database: 'story-database',
        schema: 'story-schema',
        runMigrations: false,
    },
    http: {
        host: 'http-story-host',
        port: 3000,
        path: '/story-example-api/v1',
        requestOptions: {
            limit: '1mb',
        },
        cors: {
            corsOptions: {
                origin: ['http://localhost:8081', 'http://example.com'],
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
                allowedHeaders: ['Content-Type', 'Authorization'],
                credentials: true,
            },
            allowedAllHosts: true,
        },
    },
    ws: {
        host: '192.168.100.142',
        port: 9005,
    },
    rmq: {
        connect: {
            host: 'rabbitmq',
            port: 5672,
            user: 'story',
            password: 'test',
        },
        consume: {
            exchange: 'cats',
            exchangeType: 'fanout',
            exchangeDurable: false,
            bindPattern: 'story_pattern',
            queue: 'story',
            queueDurable: false,
            noAck: false,
            prefetchCount: 1,
            xMessageTtl: 10 * 60 * 1000,
            selfAck: true,
        },
        publish: {
            persistent: true,
            exchanges: {
                storyExchange1: {
                    exchange: 'story-exchange',
                    routingKey: 'story-routing-key',
                },
                storyExchange2: {
                    exchange: 'story-exchange',
                    routingKey: 'story-routing-key',
                },
            },
        },
    },
    token: {
        enabled: false,
        key: 'story-key',
        expiresIn: 24 * 60 * 60 * 1000,
        algorithm: 'HS256',
        uncheckMethods: {
            storyDomain: ['method_1', 'method_2'],
        },
    },
    filesAdapter: {
        maxFileSizeMb: 10,
        createPath: '/story-api/v1/create',
        createBase64Path: '/story-api/v1/createBase64',
        getPath: '/story-api/v1/get',
        destination: `${__dirname}/uploads`,
        imagesCompression: {
            enabled: false,
            widthPx: null,
            heightPx: null,
        },
    },
    logger: {
        replacerList: [],
    },
};
```

##### Корневой файл проекта

```JS
// app.js
const {Story} = require('story-system');
const {CatsController} = require('./src/entities/cats/cats-controller.js');
const {CatsService} = require('./src/entities/cats/cats-service.js');

class App {
    constructor() {
        Story.configInit(); // Фреймворк берет конфигурационный файл
        Story.gateInit([
            {domain: 'cats', Controller: CatsController, Service: CatsService},
        ]);
        Story.adaptersInit(); // Запускаются адаптеры, такие как адаптер к Postgres и RabbitMQ
        Story.protocolsInit(); // Запускаются сетевые протоколы (http, ws)
    }
}

new App();
```

### Для работы с сущностью

##### controller

Рассматривайте controller - как место, где находится бизнес логика. Тут нужно валидировать запрос, собирать информацию у
service и вызывать другие service

- data - *object* - весь запрос (включая служебную информацию)
    - params - *object* - тело запроса
- tokenData - *object* - данные, которые были переданы при генерации токена. (смотрите подробнее раздел "Работа с
  токеном"). Таким образом, можно извлечь эти данные и использовать их в запросе.

```JS
// cats-controller.js
const {Story} = require('story-system');
const {getCatsSchema} = require('./schemas.js');

class CatsController {
    constructor(config, catsService) {
        this.config = config;
        this.catsService = catsService;
    }

    getCats(data, tokenData) {
        Story.validator.validate(data, getCatsSchema);
        const {catId} = tokenData || {};
        console.log('${catId} - это id кота, который был передан в функцию `genetateToken` при генерации токена');
        return this.catsService.getCats(data);
    }
}

module.exports = {CatsController};
```

##### service

Рассматривайте service, как сущность, основная задача которой делать запросы в базу данных. Тут в идеальном случае не
должно быть бизнес логики

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

SQL-запросы

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
    additionalProperties: true,
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
По http всегда принимается POST-запрос. Не используйте GET, PUT и так далее

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
  "error": {
    "code": 403,
    "name": "Forbidden",
    "message": "error message"
  }
}
```

### Коммуникационные протоколы

Из коробки поддерживаются три протокола: http, ws, rmq.  
Чтобы включить/отключить протокол, достаточно в файле конфига указывать/не указывать соответствующую настройку.   
То есть если в файле конфига не будет настроек по `ws` - сервис не будет принимать сообщения по `ws`.  
Важно указать, что независимо от протокола, сообщение и ответ имеют один и тот же [вид](#Пример-запроса), что, по-моему,
мнению очень удобно.

#### http

- HTTP-адаптер принимает только `POST` на `http.path`
- Тело запроса должно соответствовать [общему формату](#Пример-запроса)
- Лимиты тела настраиваются в `http.requestOptions`
- CORS настраивается через `http.cors`
    - `allowedAllHosts: true` включает `cors()` без ограничений
    - `allowedAllHosts: false` включает `cors(corsOptions)`

Если в конфиге есть `filesAdapter`, дополнительно поднимаются маршруты:

- `filesAdapter.createPath` - `multipart/form-data` (поле файла: `image`)
- `filesAdapter.createBase64Path` - JSON с `params.base64File`
- `filesAdapter.getPath` - статическая выдача файлов из `filesAdapter.destination`

#### websockets

Полезно, когда сервису нужно принимать сообщения в реалтайме. Можно слушать сообщения по ws и отправлять их. Вот пример
отправки сообщения по `ws`:

```JS
async
createMessage(data)
{
    const message = 'Привет кот!';
    const sessionId = 'some guid';

    await Story.wsAdapter.send(message, {
        sessionId,
        domain: 'cats',
        event: 'catCreated',
    });

    return message;
}
```

Как мы видим, метод `Story.wsAdapter.send()` принимает два параметра:

- `message` - тело сообщения
- `options` - параметры сообщения
    - `sessionId` - идентификатор ws-сессии. Дело в том, что когда к вашему сервису подрубается клиент по ws, для него
      создается ws-сессия и присваивается `sessionId`. Этот `sessionId` отправляется клиенту сразу после подключения.
      Это нужно, чтобы различать ws-клиентов. Когда клиент отключается - он теряет сессию и при переподключении для него
      создается новая сессия. Об этом подробнее написано в разделе про работу модулей.
    - `domain` - домен сообщения, чтобы клиент знал, с какого домена пришло сообщение
    - `event` - событие сообщения, чтобы клиент знал, какое событие породило это сообщение

#### rmq

Сервис поддерживают работу с RabbitMQ. Поддержка других брокеров сообщений появится в след версиях при необходимости.  
С использованием rabbitMQ появляется возможность легкого распараллеливания работы между несколькими инстансами одного
сервиса. Так же можно упростить взаимодействие между сервисами.

Все поля из конфигурации более подробно описаны [здесь](#Rmq-Adapter)

```javascript
module.exports = {
    rmq: {
        connect: {
            // Настройки подключения
            host: '127.10.10.11',
            port: 5672,
            user: 'test',
            password: 'test',
        },
        consume: {
            // Настройки прослушки сообщений
            exchange: 'cats',
            exchangeType: 'direct',
            exchangeDurable: false,
            bindPattern: 'cats_pattern',
            queue: 'cats',
            queueDurable: false,
            noAck: false,
            prefetchCount: 1,
            xMessageTtl: 10 * 60 * 1000,
            selfAck: true,
        },
        publish: {
            // Настройки отправки сообщений
            persistent: true,
            exchanges: {
                // Обменники, в которые публикуем сообщения
                dogs: {
                    exchange: 'story',
                    routingKey: 'account',
                },
            },
        },
    }
}

```

Пример публикации сообщения в rmq

```js
const {rmq: {publish: {exchanges}}} = require('../../../config');

async function publishCatInRmq() {
    await Story.rmqAdapter.publish({
        message: {
            domain: 'messages',
            event: 'test',
            params: {},
            token: await Story.token.generateToken({catId: 1}),
        },
        options: exchanges.dogs,
    });
}
```

### Ошибки

Ошибка базы данных

```json
{
  "code": 1900,
  "name": "Database error",
  "message": "error message"
}
```

Ошибка rmq

```json
{
  "code": 1600,
  "name": "RMQ error",
  "message": "error message"
}
```

Ошибка валидации

```json
{
  "code": 422,
  "name": "Validation error",
  "message": "error message"
}
```

Ошибка токена

```json
{
  "code": 401,
  "name": "Token error",
  "message": "error message"
}
```

Ошибка доступа

```json
{
  "code": 403,
  "name": "Forbidden",
  "message": "error message"
}
```

Ошибка NotFound

```json
{
  "code": 404,
  "name": "Not found",
  "message": "error message"
}
```

Ошибка BadRequest

```json
{
  "code": 400,
  "name": "Bad request",
  "message": "error message"
}
```

Ошибка Internal

```json
{
  "code": 500,
  "name": "Internal error",
  "message": "error message"
}
```

## Работа с БД

- Сейчас Story поддерживает только Postgres

```shell
# Создать миграцию миграции
db-migrate create <название миграции> --config ./database.json -e pg -m ./migrations --sql-file
```

```shell
# Накатить миграцию
db-migrate up --config ./database.development.json -m ./migrations
```

## Работа с токеном

Рассмотрим ещё раз конфигурационный файл и в нем настройку работы с токеном:

```js
module.exports = {
  token: {
    enabled: true,
    key: 'token-key',
    expiresIn: '15m',
    algorithm: 'HS256',
    uncheckMethods: {
      cats: ['signIn', 'createCat'],
    },
  },
};
```

Давайте разберем подробнее каждую настройку:

- `enabled`- *boolean* - если true, то у всех запросов будет проверяться токен
- `key` - *string* - секрет для подписи JWT
- `expiresIn` - см формат `jsonwebtoken` (`'15m'`, `'7d'` или число в секундах). Рекомендуется строковый формат
- `algorithm` - *string* - алгоритм подписи JWT (например `HS256`)
- `uncheckMethods`- *object* - Объект ключами которого являются домены (`domain`), а значениям - массив
  методов (`event`). Для
  этих методов токен не будет проверяться, даже если будет включен флаг enabled. Обратная логика будет реализована в
  след. версиях

Пример авторизации, с генерацией и возвращением токена

```js
signIn(data)
{
    Story.validator.validate(data, signInSchema);
    const [cat] = await this.accountsService.getCats(data);
    if (!cat) {
        throw new Story.errors.Forbidden('Нет такого кота!');
    }

    return {token: await Story.token.generateToken(cat)};
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

Данный раздел будет полезен для разработчиков, которые хотят понять, как работают модули Story и предложить какие-то
улучшения.  
Я всегда буду рад помощи в развитии этого фреймворка, т.к. конечно же он не может быть идеальным с первого релиза.   
Story - это что-то среднее между минималистическим express.js и довольно сложным Nest.js, но со своими особенностями,
такими как работа с БД и доменно-событийная модель. Присылайте свои идеи по улучшения и mergeRequests!

[//]: # (
Рекомендуемый порядок: configInit -> gateInit -> adaptersInit -> protocolsInit
)

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
  (`controllers[data.domain][data.event](data, tokenData)`, где `data` - это тело запроса)
- Приводит ответ к системному ответу
- Возвращает ответ

*Примечание*. Если вы задаетесь вопросом, как запросы попадают в `gate`, то обратите внимание на [корневой](index.js)
файл фреймворка. Здесь видно, что после инициализации в адаптеры передаются колбэком метод
`gate.run(request)`, который после инициализации проекта содержит всю логику контроллеров в себе.

### http-adapter

- Поднимает `express` сервер на `http.host:http.port`
- Регистрирует `POST` обработчик для `http.path`
- Поддерживает CORS (`http.cors`) и лимиты тела (`http.requestOptions`)
- При наличии `filesAdapter` регистрирует маршруты загрузки/выдачи файлов

### ws-adapter

- Поднимает WebSocket-сервер на `ws.host/ws.port`
- При подключении клиента отправляет `{sessionId}` и хранит его в памяти
- Все входящие сообщения передаются в `gate.run`
- Для исходящих сообщений используйте `Story.wsAdapter.send(message, options)`

### db-adapter

- Создает `pg.Pool` с параметрами из `db`
- По флагу `db.runMigrations` запускает `db-adapter/migration-runner.sh`
- Выполняет SQL через `Story.dbAdapter.execQuery({queryName, params, options})`
- Поддерживает шаблоны вида `/*paramName: ... */` для условных фрагментов SQL

### files-adapter

- Принимает загрузку `multipart` и `base64`
- Контролирует максимальный размер файла через `maxFileSizeMb`
- Поддерживает опциональное сжатие изображений (`imagesCompression.enabled`)
- Умеет удалять файл методом `Story.filesAdapter.deleteFileByName(filename)`

### validator

- Обертка над `jsonschema`
- Встроенные типы схем доступны через `Story.validator.schemaItems`
- В случае ошибки выбрасывается `ValidationError`

### logger

- Логи `info/error` с timestamp
- Поддержка маскировки полей через `logger.replacerList` в конфиге
- Маскировка применяется рекурсивно к объектам логов

### Rmq Adapter

Используется библиотека amqplib. Модуль содержит три основных метода: `run`, `consume`, `publish`

#### run

Инициализирующий метод

- Подключается к серверу rabbitMQ
- Вызывает метод `consume`
- Использует настройки конфига:
    - `host` - хост сервера rabbitMQ
    - `port` - порт сервера rabbitMQ
    - `user` - логин сервера rabbitMQ
    - `password` - пароль сервера rabbitMQ

#### consume

Метод, запускает процесс прослушивания и обработки сообщений

- Создает канал `connection.createChannel()`
    - В рамках канала настраивает обменник `channel.assertExchange(exchange, type, options)`
    - Настраивает очередь `channel.assertQueue(queue, options)`
        - Настраивает привязку `channel.bindQueue(queue, source, pattern, args)`. Нужно для маршрутизации сообщений.
          Подробнее [тут](https://www.rabbitmq.com/tutorials/tutorial-four-javascript.html)
    - Запускает прослушку сообщений: `channel.consume()`
- Использует настройки конфига:
    - `exchange` - название exchange
    - `exchangeType` - тип маршрутизатора. Подробнее про
      типы [тут](https://habr.com/ru/company/southbridge/blog/703060/)
      и [тут](https://www.rabbitmq.com/tutorials/tutorial-three-javascript.html)
        - `fanout` - отправляет сообщения во все известные каналы
        - `direct` - отправляет сообщения только в те каналы, где `routingKey` полностью совпадает с `bindPattern`
        - `topic`
        - `headers`
    - `exchangeDurable` - *boolean*
        - `true` - обменник будет сохранять свое состояние и восстанавливается после перезапуска сервера брокера
        - `false` - после перезапуска брокера обменник удалится
    - `bindPattern` - паттерн, по которому надо привязывать обменники с очередями. Необходимо, если типа
      обменника `direct` или `topic`
    - `queue` - *string* - Название очереди, которую создаем и будем слушать. Если `queue = ""` rabbit создаст временную
      очередь со сгенерированным названием и удалит после отключение потребителя
    - `queueDurable` - *boolean*
        - `true` - очередь будет сохранять свое состояние и восстанавливается после перезапуска сервера брокера
        - `false` - после перезапуска брокера очередь удалится
    - `exchangeDurable` - *boolean* - если true, то exchange будет сохранять свое состояние и восстанавливается после
      перезапуска сервера/брокера
    - `noAck`- *boolean* - режим подтверждения сообщений
        - `false` - ручное подтверждение: `ack` после успешного `callback`, при ошибке `nack` с requeue
        - `true` - подтверждение на стороне RabbitMQ без ручных `ack/nack`
    - `prefetchCount` - *number* - Максимальное количество сообщений, принимаемых потребителем за раз. Установив `1`
      rabbit не отправит новое сообщение сервису, пока тот не подтвердит старое
    - `xMessageTtl` - *number* - время жизни сообщений в миллисекундах. После этого сообщения удаляются из очереди, даже
      если не были акнуты
    - `selfAck` - *boolean* - полезно, когда вы хотите просто запублишить сообщение во все очереди, но хотите, чтобы
      сервис не считал свое собственное сообщение. Используется при `exchangeType = fanout`
        - `true` - сервис будет автоматически подтверждать свои сообщения без обработки. Это работает благодаря подписи
          отправляемых сообщений строкой конифга consume. Подробнее смотрите код
        - `false` - сервис не будет подтверждать свои сообщения и тогда возможно возникновение цикличности.

#### publish

Публичный метод для публикации сообщений и настраивается параметры конфига

- Использует настройки конфига:
    - `persistent` - *boolean*
        - `true` - сообщения не потеряются даже при аварии на сервере rabbitMQ. Это работает в паре с `durable: true`
        - `false` - сообщения удаляются после перезапуска сервера брокера. Это полезно, когда скорость важнее, чем
          надежность
- Использует опции сообщения:
    - `exchange` - название обменника, в который мы хотим опубликовать сообщение
    - `routingKey` - ключ маршрутизации. Указывает, в какие очереди должны попасть сообщения. Используется
      exchangeType `direct` и `topic`
