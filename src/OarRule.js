

export default class OarRule {
    
    ruling = null;
    doc = null;
    loaded = false;

    ruleHeader = null;
    ruleSections = [];

    headerExpression = /^(\d{3}\-\d{3}\-\d{4})/g;

    // needs to fetch from the site
    // https://secure.sos.state.or.us/oard/viewSingleRule.action
    // the fetch request requires the combined chapter, division and ruling
    // inside of the request, we will receive the entire pages' contents (as HTML?)
    // we must parse the HTML/raw text and find the element with the 'content' ID
    // then from there, we have access to the content of the ruling, separated by headers and p tags
    
    // note: can't send a fetch request to https://secure.sos.state.or.us. 
    // site does not return actual information when a fetch request is manually sent while in the site itself.
    // the resulting information is "Please enable javascript to view the page content."

    toString() {
        const serializer = new XMLSerializer();
        const list = document.createElement("div");

        list.appendChild(this.ruleHeader);
        for (const child in this.ruleSections) {
            let childSection = this.ruleSections[child];
            list.appendChild(childSection);
        }

        return serializer.serializeToString(list);
    }

    async load(resp) {
        if (this.loaded) { return Promise.resolve(this.doc); } // ?

        let html = await resp.text();

        const parser = new DOMParser();
        this.doc = parser.parseFromString(html, "text/html");

        console.log(this.doc);

        this.loaded = true;
        return this.doc;
    }

    parse() {
        let content = this.doc.getElementById("content");

        // after getting content, go through children of element and save to array
        for (const index in content.children) {
            let node = content.children[index];
            
            if (node.tagName != "P") {
                continue;
            }

            let text = node.innerText;

            if (OarRule.isReference(text)) {
                break;
            }

            if (OarRule.isHeader(text) && !OarRule.headerAlreadyFilled()) {
                this.ruleHeader = text;
            } else {
                this.ruleSections.push(text);
            }
        }
    }

    static isReference(text) {
        text = text.toLowerCase();
        return text.includes("statutory/other authority");
    }

    // check first
    static isHeader(text) {
        return text.search(this.headerExpression);
    }

    static headerAlreadyFilled() {
        return this.ruleHeader != null;
    }

    // this assumes that load and parse have been run
    injectAnchors() {
        var headerDiv = document.createElement('div');
        headerDiv.setAttribute('id', "header");
        headerDiv.style.fontWeight = "bold";
        headerDiv.innerText = this.ruleHeader;

        this.ruleHeader = headerDiv;

        for (const child in this.ruleSections) {
            let item = this.ruleSections[child];
            let childHead = item.charAt(1);

            var div = document.createElement('div');
            div.setAttribute('id', "section-"+childHead);
            div.innerText = item;

            this.ruleSections[child] = div;
        }

        this.formatted = true;
    }




}