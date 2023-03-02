const { json } = require("body-parser");
const { Router } = require("express");
const express = require("express");
const Client = require("pg").Pool;

const client = new Client({
    user: "dhawansolanki",
    host: "db.bit.io",
    database: "dhawansolanki/openremote",
    password: "v2_3zhQc_ZWqNqDpQMaCdKxM3tq4VEgt",
    port:5432,
    ssl:true
  });
  
const router = express.Router();

let deviceTypes = 'A'

router.post("/", async (req, res) => {
  try {
    res.send("FetchDetails API LOADED...");
  }catch (err) {
    res.status(400).json(err);
  }
});

router.post('/adddata/:id/:name/:flow_reading/:totaliser_reading', (req, res) => {
    let id = req.params.id
    let name = req.params.name
    let flow_reading = req.params.flow_reading
    let totaliser_reading = req.params.totaliser_reading
    client.query(
        `INSERT INTO device (  id, name,flow_reading,totaliser_reading
            ) VALUES ($1,$2,$3,$4);`,
        [
            id,name,flow_reading,totaliser_reading
        ],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(400).json({
              error: "Database error",
            });
          } else {
            res.status(200).send({ message: "DATA added to database" });
          }
        }
      );
        res.status('Data Added')
    // res.json(deviceTypes);
  });
  
  router.get('/getdata/:id', async (req, res) => {
    const id = req.params.id;
    console.log("Id : ",id)
    try {
      const result = await client.query(`SELECT * FROM device WHERE id=$1`, [id]);
      res.send(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving data from bit.io database');
    }
  });
  router.put('/updatedata/:id', async (req, res) => {
    const { id } = req.params;
    const { name, flow_reading, totaliser_reading, changes } = req.body;
    try {
      const result1 = await client.query(
        'UPDATE device SET name=$1, flow_reading=$2, totaliser_reading=$3 WHERE id=$4 RETURNING *',
        [name, flow_reading, totaliser_reading, id]
      );
      const result2 = await client.query(
        'INSERT INTO devicehistory (device_id, changes,timestamp) VALUES ($1, $2,NOW()) RETURNING *',
        [id, changes]
      );
      res.send({ updatedDevice: result1.rows[0], historyRecord: result2.rows[0] });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error updating data in database');
    }
  });
  
  

  // ----------------
  
  router.post('/devicetypes', (req, res) => {
    const deviceType = req.body;
    deviceTypes.push(deviceType);
    res.status(201).send('Device type created');
  });
  
  router.put('/devicetypes/:id', (req, res) => {
    const id = req.params.id;
    const deviceType = deviceTypes.find((dt) => dt.Id == id);
    if (deviceType) {
      deviceType.Name = req.body.Name;
      res.send('Device type updated');
    } else {
      res.status(404).send('Device type not found');
    }
  });
  
  router.delete('/devicetypes/:id', (req, res) => {
    const id = req.params.id;
    const deviceTypeIndex = deviceTypes.findIndex((dt) => dt.Id == id);
    if (deviceTypeIndex >= 0) {
      deviceTypes.splice(deviceTypeIndex, 1);
      res.send('Device type deleted');
    } else {
      res.status(404).send('Device type not found');
    }
  });

module.exports = router;
