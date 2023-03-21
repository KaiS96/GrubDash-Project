const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// list the orders
function list(req, res) {
  const { dishId } = req.params;
  if (dishId) {
    let filteredOrders = orders.filter((order) => order.dishId === dishId);
    res.json({ data: filteredOrders });
  } else {
    res.json({ data: orders });
  }
}

// create an order
function create(req, res) {
  const { data: { deliverTo, mobileNumber, dishes, quantity } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    quantity,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

// checks if the fields are filled in
function validateChecksField(field) {
  const validateFieldExists = (req, res, next) => {
    if (!req.body.data[field]) {
      return next({ status: 400, message: `${field} is required.` });
    } else {
      return next();
    }
  };
  return validateFieldExists;
}

function validateDataExists(req, res, next) {
  const data = req.body.data;
  if (data) {
    next();
  } else {
    next({
      status: 400,
      message: "request must include data",
    });
  }
}

// check is the dishes is an array or exists
function validateDishes(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (Array.isArray(dishes) && dishes.length) {
    return next();
  }
  return next({
    status: 400,
    message: `Order must include at least one dish`,
  });
}

// check is dish quantity is valid
function validateDishQuantity(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  dishes.map((dish, index) => {
    if (
      dish.quantity < 1 ||
      !Number.isInteger(dish.quantity) ||
      !dish.quantity
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  return next();
}

function validateOrderExists(req, res, next) {
  const { orderId } = req.params;
  const orderIndex = orders.findIndex((order) => order.id === orderId);

  // make sure we found a order
  if (orderIndex < 0) {
    return next({
      status: 404,
      message: `Order id does not match route id. Order: ${orders.id}, Route: ${orderId}.`,
    });
  } else {
    // save the order and its index for future middleware use
    res.locals.orderIndex = orderIndex;
    res.locals.order = orders[orderIndex];
    next();
  }
}

// read an order
function read(req, res, next) {
  const { order } = res.locals;
  res.json({ data: order });
}

// update an order 
function update(req, res, next) {
  const { orderId } = req.params;
  const { order, orderIndex } = res.locals;
  const { data: { id, deliverTo, mobileNumber, dishes, quantity } = {} } =
    req.body;
  if (id === orderId || id === undefined || !id || id === null) {
    const updatedOrder = {
      ...order,
      deliverTo,
      mobileNumber,
      dishes,
      quantity,
    };
    orders.splice(orderIndex, 1, updatedOrder);
    res.json({ data: updatedOrder });
  }
  return next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
  });
}

// checking if order status is valid
function validateStatus(req, res, next) {
    const { data: { status } = {} } = req.body;
    const validStatus = [ "pending", "preparing", "out-for-delivery", "delivered"]
    if (!status || !validStatus.includes(status)) {
        next({
            status: 400,
            message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
        })
    }
    return next();
}

// checking is order status === delivered
function validateDevlieryStatus(req, res, next) {
    const { data: { status } = {} } = req.body;
    if (status === "delivered") {
        next({
            status: 400,
            message: `A delivered order cannot be changed`
        })
    }
    return next();
}

// delete an order
function destroy(req, res, next) {
  //   const { orderIndex } = req.locals;
  const { orderId } = req.params;
  const { order } = res.locals
  const index = orders.findIndex((order) => order.id === orderId);

  if (index > -1 && order.status == "pending") {
    orders.splice(index, 1);
    res.sendStatus(204);
  }
  next({
    status: 400,
    message: `An order cannot be deleted unless it is pending`
  })
}

module.exports = {
  validateOrderExists,
  list: list,
  create: [
    validateDataExists,
    validateDishes,
    validateDishQuantity,
    validateChecksField("deliverTo"),
    validateChecksField("mobileNumber"),
    validateChecksField("dishes"),
    create,
  ],
  read: [validateOrderExists, read],
  update: [
    validateDataExists,
    validateDishes,
    validateDishQuantity,
    validateOrderExists,
    validateStatus,
    validateDevlieryStatus,
    ...["deliverTo", "mobileNumber", "dishes"].map(validateChecksField),
    update,
  ],
  delete: [validateOrderExists, destroy],
};
