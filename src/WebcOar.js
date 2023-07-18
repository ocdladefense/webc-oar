import { HttpClient } from "../node_modules/@ocdladefense/lib-http/HttpClient.js";
import { Url } from "../node_modules/@ocdladefense/lib-http/Url.js";
import { OarApiMock } from "../dev_modules/lib-mock/OarAPIMock.js";
import { OarRuling } from "../dev_modules/lib-fetch/OarFetch.js";
import { HttpCache } from "../node_modules/@ocdladefense/lib-http/HttpCache.js";
import "../node_modules/@ocdladefense/lib-polyfill/Response.js";
export { WebcOarAPI };

const env = {
    chapter: '213',
    division: '002',
    ruling: '0001',
}

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
    
    // Called each time the element is appended to the window/another element
    async connectedCallback() {

        const shadow = this.attachShadow({ mode: "open" });

        const list = document.createElement("div");

        this.list = list;
        
        this.shadowRoot.append(list);

        const config = {};
        const client = new HttpClient(config);
        let oarFetch = new OarRuling();

        let url = WebcOarAPI.queryByRuling(this.chapter, this.division, this.ruling);
        HttpClient.register("appdev.ocdla.org", new OarApiMock());



        const req = new Request(url);

        let resp = OarRuling.getCache(req.url);

        if (resp == null) {
            resp = await client.send(req);

            OarRuling.setCache(req.url, resp);
        }

        let doc = await oarFetch.load(resp);
        oarFetch.parse();
        oarFetch.injectAnchors();
        this.list.innerHTML = oarFetch.toString();
        /*
        resp
        .then(ruling => {

            if (ruling.error) {
                throw new Error(ruling.message, { cause: ruling });
            }
            console.log(ruling);

            this.list.innerHTML = this.render(ruling).join("<br>");
        })
        .catch(error => {
            console.error(error);
            if (env.displayErrors && error.cause.code == "RANGE_EMPTY") {
                this.list.innerHTML = "Free to Register";
            }
        });
        */
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