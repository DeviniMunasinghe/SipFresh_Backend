const db = require("../../config");

class OrderDetails {
  //Insert delivery details for an order
  static async createOrderDetails(
    orderId,
    firstName,
    lastName,
    address,
    city,
    postalCode,
    phoneNumber
  ) {
    return db.execute(
      "INSERT INTO order_details(order_id, first_name, last_name, address, city, postal_code, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [orderId, firstName, lastName, address, city, postalCode, phoneNumber]
    );
  }

  //Get order details by orderID
  static async getDetailsByOrderId(orderId) {
    const [row] = await db.execute(
      "SELECT*FROM order_details WHERE order_id=?",
      [orderId]
    );
    //return the first row
    return row[0];
  }
}

module.exports = OrderDetails;
