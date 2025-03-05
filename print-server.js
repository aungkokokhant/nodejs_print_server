const express = require("express");
const bodyParser = require("body-parser");
const escpos = require("escpos");
const Network = require("escpos-network");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.post("/print", async (req, res) => {
  try {
    const {
      invoiceType,
      dateTime,
      clinicName,
      phoneNumber,
      items,
      subtotal,
      discount,
      tax,
      grandTotal,
      doctor,
      patient,
      followup,
      printerIP,
      printerPort,
      isTest,
    } = req.body;

    if (!printerIP || !printerPort) {
      return res
        .status(400)
        .json({ error: "Printer IP and port are required" });
    }

    const device = new Network(printerIP, parseInt(printerPort, 10));
    const printer = new escpos.Printer(device);

    device.open((err) => {
      if (err) {
        console.error("Printer connection error:", err);
        return res.status(500).json({ error: "Failed to connect to printer" });
      }

      if (isTest) {
        printer.style("B").text(clinicName).style("NORMAL").text(phoneNumber);
        printer
          .feed(2)
          .cut()
          .close(() => {
            console.log("Print job completed.");
          });
        res.json({ message: "Print job received" });
      } else {
        if (!items || !Array.isArray(items) || items.length === 0) {
          return res
            .status(400)
            .json({ error: "No items provided for printing" });
        }
        const formatAmount = (amount) => amount.toLocaleString();
        printer.font("A").align("ct");
        printer.style("B").text(clinicName).style("NORMAL").text(phoneNumber);
        printer.tableCustom([
          { text: dateTime, align: "LEFT", width: 0.6 },
          { text: invoiceType, align: "RIGHT", width: 0.4 },
        ]);
        printer.text("-".repeat(48));
        if (doctor) {
          printer.tableCustom([
            { text: "Doctor Name", align: "LEFT", width: 0.5 },
            { text: doctor, align: "RIGHT", width: 0.5 },
          ]);
        }
        if (patient) {
          printer.tableCustom([
            { text: "Patient Name", align: "LEFT", width: 0.5 },
            { text: patient, align: "RIGHT", width: 0.5 },
          ]);
        }
        if (followup) {
          printer.tableCustom([
            { text: "Follow Up Date", align: "LEFT", width: 0.5 },
            { text: followup, align: "RIGHT", width: 0.5 },
          ]);
        }
        printer.text("-".repeat(48));
        printer.tableCustom([
          { text: "Qty", align: "LEFT", width: 0.15 },
          { text: "Item Name", align: "LEFT", width: 0.55 },
          { text: "Amount", align: "RIGHT", width: 0.3 },
        ]);
        printer.text("-".repeat(48));
        items.forEach(({ qty, name, price }) => {
          printer.tableCustom([
            { text: qty.toString(), align: "LEFT", width: 0.15 },
            { text: name, align: "LEFT", width: 0.55 },
            { text: formatAmount(price), align: "RIGHT", width: 0.3 },
          ]);
        });
        printer.text("-".repeat(48));
        printer.tableCustom([
          { text: "Subtotal:", align: "LEFT", width: 0.7 },
          { text: formatAmount(subtotal), align: "RIGHT", width: 0.3 },
        ]);
        if (discount) {
          printer.tableCustom([
            { text: "Discount:", align: "LEFT", width: 0.7 },
            { text: formatAmount(discount), align: "RIGHT", width: 0.3 },
          ]);
        }
        if (tax) {
          printer.tableCustom([
            { text: "Tax:", align: "LEFT", width: 0.7 },
            { text: formatAmount(tax), align: "RIGHT", width: 0.3 },
          ]);
        }
        printer.text("-".repeat(48));
        printer.style("B");
        printer.tableCustom([
          { text: "Grand Total:", align: "LEFT", width: 0.7 },
          { text: formatAmount(grandTotal), align: "RIGHT", width: 0.3 },
        ]);
        printer.text("-".repeat(48));
        printer
          .style("NORMAL")
          .text(
            "Thank you for choosing Chan Myae\nYour health is our priority. See you well soon!"
          );
        printer
          .feed(2)
          .cut()
          .close(() => {
            console.log("Print job completed.");
          });
        res.json({ message: "Print job received" });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.error(error);
  }
});

app.listen(PORT, () => {
  console.log(`Print server running on http://localhost:${PORT}`);
});
