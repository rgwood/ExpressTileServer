const express = require("express")
const app = express()
const { Pool } = require("pg")
const cors = require('cors')
const pool = new Pool({
    host: "localhost",
    port: 5432,
    user: "docker",
    database: "gis",
    password: "docker"
})

app.use(express.static("./"))
app.use(cors());

app.get("/mvt/:x/:y/:z", function(req, res) {
    console.log(`called for ${req.params.x}/${req.params.y}/${req.params.z}`)

    const sql = `
        SELECT ST_AsMVT(q)
        FROM (
            SELECT
                ST_AsMVTGeom(
                    geom,
                    TileBBox($1, $2, $3, 3857),
                    4096,
                    0,
                    false
                ) geom
            FROM van_parcels
            WHERE ST_Intersects(geom, TileBBox($1, $2, $3, 3857))
        ) q`
    const values = [req.params.z, req.params.x, req.params.y]
    pool.query(sql, values , function(err, mvt) {
            if (err) {
                console.log(err)
            } else {
                res.setHeader('Content-Type', 'application/x-protobuf')
                res.send(mvt.rows[0].st_asmvt)
            }
    })
})

app.listen(3000, () => {
    console.log("Listening on port 3000")
})