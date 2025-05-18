const express = require("express");
const app = express();
const matchRoutes = require("./routes/matchroutes");

app.use(express.json());
app.use("/match", matchRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
