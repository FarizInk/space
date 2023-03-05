const fs = require('fs')

// Format Number Less Than 10
const fnltt = (number) => ('0' + number).slice(-2);

const createZasifer = (ctx) => {
  const date = new Date(ctx.message.date * 1000)
  const dir = `space/zasifer/${date.getFullYear()}/${fnltt(date.getMonth() + 1)}/`
  const fileName = fnltt(date.getDate()) + '.json'
  let data = []

  let zasifer = {
    content: ctx.message.text,
    created_at: date.getTime(),
  };

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  } else {
    if (fs.existsSync(dir + fileName)) {
      const oldData = fs.readFileSync(dir + fileName, "utf8")
      console.log(oldData);
      if (oldData) {
        data = JSON.parse(oldData)
      }
    }
  }

  data.push(zasifer)
  fs.writeFile(dir + fileName, JSON.stringify(data), 'utf8', (err) => {
    if (err)
      console.log(err);
    else {
      console.log("File written successfully\n");
      console.log("The written has the following contents:");
      console.log(data);
    }
  });
}

module.exports = {
  createZasifer
}