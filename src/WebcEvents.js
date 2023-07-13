import { HttpClient } from "../node_modules/@ocdladefense/lib-http/HttpClient.js";
import { Url } from "../node_modules/@ocdladefense/lib-http/Url.js";
import { GoogleApisCalendarMock } from "../dev_modules/lib-mock/GoogleApisCalendarMock.js";
import { ISODate } from "../dev_modules/lib-date/ISODate.js";
import "../node_modules/@ocdladefense/lib-polyfill/Response.js";
export { WebcEvents };

// Pretending what the current environment looks like for this machine/application.
const env = {
    today: "2023-06-30",
    season: "spring",
    weather: "mostly sunny",
    city: "Corvallis, OR",
    displayErrors: true, // We can imagine sceniors where we might *want to dipslay a message to the user.
};


const GOOGLE_CALENDAR_EVENTS_ENDPOINT = "https://www.googleapis.com/calendar/v3/calendars";



class WebcEvents extends HTMLElement {

    startDate = null;

    endDate = null;

    constructor() {
        super();

        this.calendarId = this.getAttribute("calendar-id");

        if (this.calendarId == null) {
            console.error("REQUIRED_ATTRIBUTE_MISSING: calendar-id.");
        }

        this.startDate = this.getAttribute("start-date") || env.today;
        this.endDate = this.getAttribute("end-date") || env.today;
    }
    
    // Called each time the element is appended to the window/another element
    async connectedCallback() {
        const shadow = this.attachShadow({ mode: "open" });

        const list = document.createElement("div");

        this.list = list;
        
        this.shadowRoot.append(list);

        const config = {};
        const client = new HttpClient(config);

        let url = WebcEvents.queryByDateRange(this.calendarId, this.startDate, this.endDate);
        HttpClient.register("www.googleapis.com", new GoogleApisCalendarMock());

        const req = new Request(url);

        const resp = await client.send(req);
        //wasn't working like this so went back to old way temporarily 
        //await client.send(req)
        resp.json()
        .then(events => {

            if (events.error) {
                throw new Error(events.message, { cause: events });
            }
            console.log(events);

            this.list.innerHTML = this.render(events).join("\n");
        })
        .catch(error => {
            // alert('Error: ' + error.message);
            console.error(error);
            if (env.displayErrors && error.cause.code == "RANGE_EMPTY") { // Might help the customer.
                this.list.innerHTML = "Free to Register";
            }
        });
    }

    static queryByDateRange(calendarId, start = null, end = null) {
        // built-ins

        let url = GOOGLE_CALENDAR_EVENTS_ENDPOINT + "/" + calendarId + "/event";
        url = new Url(url);
        url.buildQuery("timeMin", start);
        url.buildQuery("timeMax", end);
        url.buildQuery("TEST");
    
        return url.toString();
    }

    render(data) {
        // This is how we pass an identifier to map().
        return data.length == 0 ? "No Events" : data.map(this.renderEvent); 
    }

    renderEvent(event, index) {
        let startDate = new ISODate(event.start.date || event.start.dateTime)
        let endDate = new ISODate(event.end.date || event.end.dateTime);
        startDate = startDate.eventDate(event);
        endDate = endDate.eventDate(event);

        return `<div key=${index}>
            <h2>${event.summary}</h2>
            <p>Location: ${event.location}</p>
            <p>Description: ${event.description}</p>
            <p>Start Date: ${startDate}</p>
            <p>End Date: ${endDate}</p>
        </div>`;
    }


}