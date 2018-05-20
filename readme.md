# Lucidum

## Examples can be found in '*examples*' folder

---

## Basic instance

```javascript
let vm = new Lucidum({
  data: {
    mynum: 3,
    user: {
      name: "chris",
      age: 16
    },
    foodList: ["Apple", "Bread", "Cookie"],
    newFoodItem: "Grapes"
  },
  methods: {
    getCurrentDate() {
      return new Date().getFullYear();
    }
  },
  watch: [
    {
      prop: "user.name",
      fn(val, oldVal) {
        console.log(`property 'user.name' changed from ${oldVal} to ${val}`);
      }
    }
  ],
  onCreate() {
    console.log("Lucidum instance loaded");
  },
  el: "#app"
});
```

---

## Supported features

### Property and function interpolation

```html
<h1>Hello {{user.name}}</h1>
<p>The date is {{getCurrentDate(())}}</p>
```

---

### Property binding

```html
<input bindval="user.name"></input>
```

---

### Event binding

```html
<button @click="user.age++"></button>
```

---

### Conditional rendering

```html
<p showif="user.name === 'chris'">Your name is chris</p>
<p showelse>Your name is not chris</p>
```

---

### Dynamic lists

```html
<ul>
  <li loopfor="(index, food) in foodList">
    {{index}}: {{food}}
  </li>
</ul>
```

---

### Property watching

```javascript
watch: [
  {
    prop: "user.name",
    fn(val, oldVal) {
      console.log(`property 'user.name' changed from ${oldVal} to ${val}`);
    }
  }
]
```

---

### Life cycle hooks

```javascript
onCreate() {
  console.log("Lucidum instance loaded");
}
```

---
