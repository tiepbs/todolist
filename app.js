const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();


app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect("mongodb+srv://tiepbs:Tiep123456@cluster0.5wdpo.mongodb.net/todolistDB");


// Create Schema for items
const itemsSchema = {
  name: String,
};

// Create Item model
const Item = mongoose.model("Item", itemsSchema);

// Create initial items using Item model created above
const item1 = new Item({
  name: "Fifteen minutes of silent thinking.",
});
const item2 = new Item({
  name: "Fifteen minutes of planning",
});
const item3 = new Item({
  name: "Fifteen minutes of checing emails",
});

// Create a defaultItems array
const defaultItems = [item1, item2, item3];


// Create Schema for lists
const listSchema = {
  name: String,
  items: [itemsSchema]
};

// Create model for lists using listSchema created above
const List = mongoose.model("List", listSchema);


// Declare to use ejs
app.set('view engine', 'ejs');


// Create root route for GET requests to "/"
app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items into the todolistDB");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });

});


// Create dynamic route with params /:
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // Save the list name into database and then render in the newly corresponding route
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // Render the list name
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      };
    }
  })
});



// Create root route for POST requests hit to /
app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  };
});


// Create /delete route to remove exist items
app.post("/delete", function(req, res) {
  const checkedItemId = req.body.theCheckbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully removed the checked item!");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }

    })
  }
});



let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

app.listen(port, function() {
  console.log("The server is running on MongoDB Atlas or local port 3000!");
});
