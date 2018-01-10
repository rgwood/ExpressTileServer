const express = require("express")
const app = express()
const { Pool } = require("pg")
const cors = require('cors')
const SphericalMercator = require("@mapbox/sphericalmercator")
const pool = new Pool({
    host: "localhost",
    port: 5432,
    user: "docker",
    database: "gis",
    password: "docker"
})
const mercator = new SphericalMercator()

app.use(express.static("./"))
app.use(cors());

app.get("/mvt/:x/:y/:z", function(req, res) {
    let bbox = mercator.bbox(req.params.x, req.params.y, req.params.z)
    console.log(bbox.join(", "))

    const sql = `
        SELECT ST_AsMVT(q)
        FROM (
            SELECT
                ST_AsMVTGeom(
                    geom,
                    TileBBox(${req.params.z}, ${req.params.x}, ${req.params.y}, 3857),
                    4096,
                    0,
                    false
                ) geom
            FROM van_parcels
            WHERE ST_Intersects(geom, (SELECT ST_Transform(ST_MakeEnvelope($1, $2, $3, $4, $5), 3857)))
        ) q`
    const values = [bbox[0], bbox[1], bbox[2], bbox[3], 4326]
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