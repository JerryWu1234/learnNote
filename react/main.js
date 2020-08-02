import { create, Text, Wrapper } from "./create.js";
import { Carousel } from "./src/is.view";

/*let component = <div id="a" cls="b" style="width:100px;height:100px;background-color:lightgreen">
      <div></div>
      <p></p>
      <div></div>
      <div></div>
  </div>*/

let component = <Carousel></Carousel>;

component.mountTo(document.body);
/*
var component = createElement(
  Parent, 
  {
      id: "a",
      "class": "b"
  }, 
  createElement(Child, null), 
  createElement(Child, null), 
  createElement(Child, null)
);
*/

// console.log(component);

//componet.setAttribute("id", "a");
