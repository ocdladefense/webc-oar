import { HttpClient } from "../node_modules/@ocdladefense/lib-http/HttpClient.js";
import { Url } from "../node_modules/@ocdladefense/lib-http/Url.js";
import { OarApiMock } from "../node_modules/@ocdladefense/lib-mock/OarAPIMock.js";
import { OarRule } from "./OarRule.js";
import "../node_modules/@ocdladefense/lib-polyfill/Response.js";
export { WebcOarAPI };
const env = {
  chapter: '213',
  division: '002',
  ruling: '0001'
};
const OAR_ENDPOINT = "https://appdev.ocdla.org/books-online/oar.php";
// https://secure.sos.state.or.us/oard/view.action
// https://appdev.ocdla.org/books-online/oar.php?chapter=213&division=002&rule=0001

class WebcOarAPI extends HTMLElement {
  constructor() {
    super();
    this.chapter = this.getAttribute("chapter") || env.chapter;
    this.division = this.getAttribute("division") || env.division;
    this.ruling = this.getAttribute("ruling") || env.ruling;
  }

  // perhaps we can add the chapter, division, and ruling to some sort of global table, and with each new
  // connected callback we check back to that table and if those attributes already exist then we wait for
  // it to be filled in the table itself, that way we aren't calling multiple fetch requests with each
  // new element that has the same attributes.

  // Called each time the element is appended to the window/another element
  async connectedCallback() {
    const shadow = this.attachShadow({
      mode: "open"
    });
    const list = document.createElement("div");
    this.list = list;
    this.shadowRoot.append(list);
    const config = {};
    const client = new HttpClient(config);
    let oarFetch = new OarRule();
    let url = WebcOarAPI.queryByRuling(this.chapter, this.division, this.ruling);
    HttpClient.register("appdev.ocdla.org", new OarApiMock());
    const req = new Request(url);
    let resp = await client.send(req);
    let doc = await oarFetch.load(resp);
    oarFetch.parse();
    oarFetch.injectAnchors();
    this.list.innerHTML = oarFetch.toString();
  }
  static queryByRuling(chapter, division, rule) {
    // built-ins

    let url = OAR_ENDPOINT;
    url = new Url(url);
    url.buildQuery("chapter", chapter);
    url.buildQuery("division", division);
    url.buildQuery("rule", rule);
    return url.toString();
  }
  render(data) {
    // This is how we pass an identifier to map().
    return data.length == 0 ? "No rulings match those identifiers." : data.map(this.renderRuling);
  }
  renderRuling(ruling, index) {
    return `<div key=${index}>
            <p>${ruling}</p>
        </div>`;
  }
}