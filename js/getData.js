// Put these into a single object someday
var sellData;
var buyData;
var subjectData;
var queriedBookData;

var loaded;

/* Function to request data from the server, it currently waits before
all responses are received before populating the html elements. This is done
in case in the future elements will need data from multiple responses. As a
result, the variable loaded keeps track of the number of responses received.
Once it hits 3, we know that was the last response, and the elements can be
populated */
function requestData(getReq, elementID) {
  var ajax = new XMLHttpRequest();

  ajax.onreadystatechange = function() {
    if(this.readyState == 4 && this.status == 200) {
      // Will make this a separate function someday as this code gets reused
      // Will also make it better
      var data = JSON.parse(this.responseText);
      switch(elementID) {
        case "sellTable":
          sellData = data;
          break;
        case "buyTable":
          buyData = data;
          break;
        case "subjectDown":
          subjectData = data;
          subjectID = subjectData[0]["uuid"];
          break;
      }

      loaded.push(elementID);

      // If all data has been loaded (indicating this is the last response)
      if (loaded.length == TOTALASSETS) {
    		for (element in loaded) {
    			var el = loaded[element];
    			switch(el) {
    				case "subjectDown":
    				  loadSelectData();
    				  break;
    				default:
    				  loadTableData(el);
    			}
    		}
      }
    }
  }

  ajax.open("GET", getReq, true);
  ajax.send();
}

function getData(getReq, elementID) {
  try {
    requestData(getReq, elementID);
  }
  catch (e) {
	console.log(e);
    display_message(MESSAGES.NET, true);
  }
}

// Creates multiple tables in a div element to show buying/selling offers
function loadTableData(tableID) {
	var data = (tableID == "sellTable") ? sellData : buyData;

	var table = $("#" + tableID);
	var htmlStr;

    if(data.length > 0) {
		htmlStr = "<table class=\"omni table table-striped table-bordered\">\
					   <thead><tr><th>Textbook Name</th>";
		if (tableID === "sellTable") {
			htmlStr += "<th>Seller Name</th>"
		} else {
			htmlStr += "<th>Buyer Name</th>"
		}

		htmlStr += "<th>Price (USD)</th>\
		<th>Contact Email</th>\
		<th>Tags</th>\
		<th>Actions</th>\
		</tr></thead><tbody>";

		for(var i = 0; i < data.length; i++) {
		  var currentEntry = data[i];

		  htmlStr += "<tr>\
		  <td>" + currentEntry["bookName"] + "</td>\
		  <td>" + currentEntry["name"] + "</td>\
		  <td>" + currentEntry["price"] + "</td>\
		  <td>" + currentEntry["email"] + "</td>\
	  <td id='" + currentEntry["uuid"] + "'></td>\
		  <td><a class='btn-small' href=\"details.html?" + currentEntry["uuid"] + "\"><i class='fas fa-ellipsis-h'></i></a>\
		  <a class='btn-small' href='mailto:" + currentEntry["email"] + "'><i class='fas fa-reply'></i></a>\
		  <a class='btn-small delete' onclick=\"passPrompt('" + currentEntry["uuid"] + "', this)\"><i class='fas fa-trash-alt'></i></a</td>\
		  </tr>";
		}

		htmlStr += "</tbody></table>";
	}
	else {
		htmlStr = "<table class=\"omni table table-striped table-bordered empty\"><tr><td>No offers so far!</td></tr></table>";
	}

  table.html(htmlStr);

  /* Populate tags after html is loaded, just in case the textbook request happens
  faster than the stringbuilder by some miracle */
  for(entry of data) {
    tags.populate_tags(entry["book_id"], entry["uuid"]);
  }
}

function loadSelectData() {

  var data = subjectData;
  var htmlStr = "";
  var inner = "subjectName";

  for(var i = 0; i < data.length; i++) {
    var currentEntry = data[i];
    htmlStr += "<option value=\"" + currentEntry["uuid"] + "\" >"
    + currentEntry[inner] + "</option>";
  }

  subjectDown.html(htmlStr);
}

// Populates a single table with textbook search results
function loadSearchedTextbooks(tableID) {
  var table = document.getElementById(tableID);
  var htmlStr = "";

  if(queriedBookData.length > 0) {
    htmlStr += "<thead><tr><th>Textbook Name</th>\
    <th>Author</th>\
    <th>ISBN</th>\
    <th>Edition/Copyright</th>\
    <th>Select</th>\
    </tr></thead>\
	<tbody>";

    for(var i = 0; i < queriedBookData.length; i++) {
      var currentEntry = queriedBookData[i];

      htmlStr += "<tr>\
      <td>" + currentEntry["bookName"] + "</td>\
      <td>" + currentEntry["author"] + "</td>\
      <td>" + currentEntry["isbn"] + "</td>\
      <td>" + currentEntry["edition"] + "</td>\
      <td><a class='btn-small' onclick=\"set_book_info(" + i.toString() + ")\"]><i class='fas fa-arrow-right'></i></a></td>\
      </tr>";
    }
	table.classList.remove("empty");
  }
  else {
    htmlStr += "<tr><td>No textbooks found</td></tr>";
	table.classList.add("empty");
  }

  table.innerHTML = htmlStr;

}

function get_subject_name(subjectID) {
  for(var i = 0; i < subjectData.length; i++) {
    var currentEntry = subjectData[i];

    if(currentEntry["uuid"] === subjectID) {
      return currentEntry["subjectName"];
    }
  }
}

