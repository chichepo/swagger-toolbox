
# Dictionary Swagger Validation Guide

This document describes the logic used by the validation mechanism for a Swagger dictionary file that maps fields to external Swagger reference files (called "host Swagger files").

---

## 🧩 Input Parameters

The validator `validate(dictJson, hostsData, serverVariablesData)` accepts:

### 1. `dictJson`
- The main Swagger OpenAPI 3 file used as a dictionary.
- This file contains references (`x-mapper-host`) to external host files.

### 2. `hostsData`
- An array of host Swagger references.
- Each element is an object with:
  ```json
  {
    "url": "https://swaggerhub.dev.com/MyDom/Pet/1.0.0",
    "key": "x-origin-host1",
    "json": { ... } // the parsed swagger
  }
  ```
- If **only one host is declared**, it should be under `"x-origin-host"` (without a number).

### 3. `serverVariablesData`
- An object with variable names as keys and their metadata as values.
  Example:
  ```json
  {
    "smf-pet.smf": {
      "default": "https://swaggerhub.dev.com/MyDom/Pet/1.0.0"
    },
    "hbs-store.hbs": {
      "default": "https://swaggerhub.dev.com/MyDom/Store/1.0.0"
    }
  }
  ```

---

## 📘 Dictionary Swagger File Structure

### 4.1 External Host Declaration

Use `x-origin-host` if only one host is declared:

```json
"x-origin-host": "https://swaggerhub.dev.com/MyDom/Pet/1.0.0"
```

If multiple hosts are declared:

```json
"x-origin-host1": "https://swaggerhub.dev.com/MyDom/Pet/1.0.0",
"x-origin-host2": "https://swaggerhub.dev.com/MyDom/Store/1.0.0"
```

---

### 4.2 Variables for Host Selection

Each host reference must also appear in `servers[0].variables`, for example:

```json
"variables": {
  "smf-pet.smf": {
    "default": "https://swaggerhub.dev.com/MyDom/Pet/1.0.0"
  },
  "hbs-store.hbs": {
    "default": "https://swaggerhub.dev.com/MyDom/Store/1.0.0"
  }
}
```

---

### 4.3 Exploratory Path Lookup

- Each external Swagger file is parsed into flattened property paths.
- Example:
  ```
  petUpdatePetWithForm.requestBody.InlineObject.date
  storePlaceOrder.responses.storeOrder.qty
  ```

---

### 4.4 x-mapper-host Field Mapping

Each property in the dictionary schema may include an `x-mapper-host`, such as:

```json
"quantity": {
  "type": "integer",
  "x-mapper-host": "hbs-store.hbs.storePlaceOrder.responses.storeOrder.qty"
}
```

It has the format:
```
<server-variable>.<path-to-property>
```

---

## ✅ Validation Rules

1. **`x-mapper-host` prefix must match a declared server variable**  
   - Example: `smf-pet.smf` must be found in `servers[0].variables`.

2. **That server variable must have a `.default` field**  
   - This `.default` must match one of the URLs in the `hostsData`.

3. **The target Swagger file must be properly loaded in `hostsData`**

4. **The path portion of `x-mapper-host` must exist** in the flattened lookup list of the corresponding Swagger file

---

## ❌ Error Messages

- Simple format:
  ```
  In 'Order.id', bad value for x-mapper-host: 'hbs-store.hbs.SwaggerPetstore.storeOrder.storeIdLalou'
  ```

- Errors are collected and printed after validation:
  ```
  ❌ Validation failed:
  ```

---

Let us know if you'd like to enforce additional constraints such as:
- Required `x-mapper-host` on every field
- Field type validation across dictionaries
