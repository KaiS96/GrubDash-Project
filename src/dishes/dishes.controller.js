const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");


// list the dishes based on the dishId
function list(req, res) {
  const { dishId } = req.params;
  res.json({
    data: dishes.filter(dishId ? (dish) => dish.id === dishId : () => true),
  });
}

// create a new dish
function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// validate if data fields exist
function validateDataExists(dataName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[dataName]) {
      return next();
    }
    next({
      status: 400,
      message: `Must include a ${dataName}`,
    });
  };
}

// validate if the price > 0
function validatePrice(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price > 0 && Number.isInteger(price)) {
    return next();
  }
  next({
    status: 400,
    message: `Dish must have a price that is an integer greater than 0`,
  });
}

//   validate if a dish exists
function validateDishExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish not found: ${req.params.dishId}`,
  });
}

// read the dishes
function read(req, res) {
  const { dish } = res.locals;
  res.json({ data: dish });
}

// update the current dish
function update(req, res, next) {
  const { dish, dishIndex } = res.locals;
  const { dishId } = req.params;
  //   const { name, description, price, image_url } = req.body.data;
  const { data: { id, name, description, price, image_url } = {} } = req.body;

  if (id === dishId || !id) {
      dish.name = name;
      dish.description = description;
      dish.price = price;
      dish.image_url = image_url;
      res.json({ data: dish });
  } 
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
  })

}

module.exports = {
  validateDishExists,
  create: [
    validateDataExists("name"),
    validateDataExists("description"),
    validateDataExists("price"),
    validateDataExists("image_url"),
    validatePrice,
    create,
  ],
  read: [validateDishExists, read],
  list,
  update: [
    validateDishExists,
    validateDataExists("name"),
    validateDataExists("description"),
    validateDataExists("price"),
    validateDataExists("image_url"),
    validatePrice,
    update,
  ],
};
