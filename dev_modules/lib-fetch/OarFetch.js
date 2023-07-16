

class OarRuling {
    
    ruling = null;
    doc = null;
    static cache = {};
    loaded = false;

    // needs to fetch from the site
    // https://secure.sos.state.or.us/oard/viewSingleRule.action
    // the fetch request requires the combined chapter, division and ruling
    // inside of the request, we will receive the entire pages' contents (as HTML?)
    // we must parse the HTML/raw text and find the element with the 'content' ID
    // then from there, we have access to the content of the ruling, separated by headers and p tags
    
    // note: can't send a fetch request to https://secure.sos.state.or.us. 
    // site does not return actual information when a fetch request is manually sent while in the site itself.
    // the resulting information is "Please enable javascript to view the page content."

    // not sure if this cache will be used or the HttpCache
    static getCached(ruling) {
        return this.cache[ruling];
    }

    async load(resp) {
        if (this.loaded) { return Promise.resolve(this.doc); } // ?

        return resp.arrayBuffer()
            .then(function (buffer) {
                const decoder = new TextDecoder("iso-8859-1");
                return decoder.decode(buffer);
            })
            .then((html) => {
                const parser = new DOMParser();
                this.doc = parser.parseFromString(html, "text/html");

                this.loaded = true;
                return this.doc;
            })
    }

    parse() {
        let content = this.doc.getElementById("content");
        let contentChildren = [];

        // after getting content, go through children of element and save to array
        for (const child in content.children) {
            if (content.children[child].tagName == "P") {
                contentChildren.push(content.children[child].innerText);
            }
        }

        return contentChildren;
    }
}