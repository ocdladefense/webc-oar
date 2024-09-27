import HttpClient from "@ocdla/lib-http/HttpClient.js";
import Url from "@ocdla/lib-http/Url.js";
import OarRule from "./OarRule.js";

const ENDPOINT = "https://appdev.ocdla.org/books-online/oar.php";
// https://secure.sos.state.or.us/oard/view.action
// https://appdev.ocdla.org/books-online/oar.php?chapter=213&division=002&rule=0001

export default class WebcOar extends HTMLDivElement {
  chapter = null;

  division = null;

  rule = null;

  // Used when labelling this section.
  label = null;

  static cache = {};




  constructor() {
    super();
    this.ref = this.getAttribute("ref") && this.getAttribute("ref").split(" ")[1];
    [this.chapter, this.division, this.rule] = this.ref.split("-").map(ref => ref.trim());
  }


  // Called each time the element is appended to the window/another element.
  async connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });

    const list = document.createElement("div");
    list.setAttribute("class", "statute");
    const style = document.createElement("style");
    style.innerText = WebcOar.getCss();

    this.list = list;

    this.shadowRoot.append(style, list);

    WebcOar.loadRule(this.chapter, this.division, this.rule)
    .then(rule => {
      rule.parse();
      rule.injectAnchors();

      let text = (this.list.innerHTML = rule.toString());
    });
  }



  static loadRule(chapterNumber, division, rule) {

    let key = [chapterNumber, division, rule].join("-");
    // If the promise that will eventually resolve to this.
    return WebcOar.cache[key] ||  (function(key) {
      let url = WebcOar.buildUrl(chapterNumber,division,rule);
      const client = new HttpClient();
      const req = new Request(url.toString());
      const chapter = client.send(req)
      .then(resp => OarRule.fromResponse(resp, chapterNumber));

      WebcOar.cache[key] = chapter;
      return WebcOar.cache[key];
    })(key);
  }



  static buildUrl(chapter, division, rule) {
    // built-ins

    let url = ENDPOINT;
    url = new Url(url);
    url.buildQuery("chapter", chapter);
    url.buildQuery("division", division);
    url.buildQuery("rule", rule);

    return url;
  }

  static getCss() {
    return `
        div[id*=section] {
            margin-top: 10px;
            margin-bottom: 5px;
        }
        .statute {
            font-family: monospace;
            border-left: 3px solid blue;
            margin-left: 50px;
            max-width: 80%;
            padding-left: 20px;
        }
        .level-0 {
            margin-left: 0px;
            margin-top: 5px;
            margin-bottom: 5px;
        }

        .level-1 {
            margin-left: 15px;
            margin-top: 5px;
            margin-bottom: 5px;
        }

        .level-2 {
            margin-left: 30px;
            margin-top: 5px;
            margin-bottom: 5px;
        }

        .level-3 {
            margin-left: 45px;
            margin-top: 5px;
            margin-bottom: 5px;
        }
        .section-label:before {
            content: "ORS ";
        }
        .section-label {
            padding: 5px;
            font-size:larger;
            font-weight: bold;
        }
        `;
  }
}
