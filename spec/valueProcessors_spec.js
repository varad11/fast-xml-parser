"use strict";

const {XMLParser, XMLValidator} = require("../src/fxp");
const he = require("he");

describe("XMLParser", function() {

    it("should decode HTML entities if allowed", function() {
        const xmlData = "<rootNode>       foo&ampbar&apos;        </rootNode>";
        const expected = {
            "rootNode": "foo&bar'"
        };

        const options = {
            parseTagValue: false,
            decodeHTMLchar: true,
            tagValueProcessor : (name,a) => he.decode(a)
        };
        const parser = new XMLParser(options);
        let result = parser.parse(xmlData);
        //console.log(JSON.stringify(result,null,4));
        expect(result).toEqual(expected);
    });

    it("should decode HTML entities / char", function() {
        const xmlData = `<element id="7" data="foo\r\nbar" bug="foo&ampbar&apos;"/>`;
        const expected = {
            "element": {
                "id":   7,
                "data": "foo bar",
                "bug":  "foo&ampbar'"
            }
        };

        const options = {
            attributeNamePrefix: "",
            ignoreAttributes:    false,
            parseAttributeValue: true,
            decodeHTMLchar:      true,
            attrValueProcessor: (name, a) => he.decode(a, {isAttributeValue: true})
        };
        const parser = new XMLParser(options);
        let result = parser.parse(xmlData);
        //console.log(JSON.stringify(result,null,4));
        expect(result).toEqual(expected);

        result = XMLValidator.validate(xmlData);
        expect(result).toBe(true);
    });

    it("tag value processor should be called with value and tag name", function() {
        const xmlData = `<?xml version='1.0'?>
        <any_name>
            <person>
                start
                <name1>Jack 1</name1 >
                middle
                <name2>35</name2>
                end
            </person>
        </any_name>`;

        const expected = {
            "any_name": {
                "person": {
                    "#text": "startmiddleend",
                    "name1": "Jack 1",
                    "name2": 35
                }
            }
        };

        const resultMap = {}
        const options = {
            tagValueProcessor: (tagName, val) => {
                if(resultMap[tagName]){
                    resultMap[tagName].push(val)
                }else{
                    resultMap[tagName] = [val];
                }
                return val;
            }
        };
        const parser = new XMLParser(options);
        let result = parser.parse(xmlData);
        // console.log(JSON.stringify(result,null,4));
        // console.log(JSON.stringify(resultMap,null,4));
        expect(result).toEqual(expected);
        expect(resultMap).toEqual({
            "person": [
                "start",
                "middle",
                "end"
            ],
            "name1": [
                "Jack 1"
            ],
            "name2": [
                "35"
            ]
        });
    });

    it("result should not change/parse values if tag processor returns nothing", function() {
        const xmlData = `<?xml version='1.0'?>
        <any_name>
            <person>
                start
                <name1>Jack 1</name1 >
                middle
                <name2>35</name2>
                end
            </person>
        </any_name>`;

        const expected = {
            "any_name": {
                "person": {
                    "name1": "Jack 1",
                    "name2": "35",
                    "#text": "startmiddleend"
                }
            }
        }
        
        const options = {
            tagValueProcessor: (tagName, val) => {}          
        };
        const parser = new XMLParser(options);
        let result = parser.parse(xmlData);
        // console.log(JSON.stringify(result,null,4));
        expect(result).toEqual(expected);
    });

    it("result should have constant value returned by tag processor", function() {
        const xmlData = `<?xml version='1.0'?>
        <any_name>
            <person>
                <name1>Jack 1</name1 >
                <name2>35</name2>
            </person>
        </any_name>`;

        const expected = {
            "any_name": {
                "person": {
                    "name1": "fxp",
                    "name2": "fxp"
                }
            }
        };

        const options = {
            tagValueProcessor: (tagName, val) => {
                return "fxp"
            }
        };
        const parser = new XMLParser(options);
        let result = parser.parse(xmlData);
        // console.log(JSON.stringify(result,null,4));
        expect(result).toEqual(expected);
    });

    it("attribute parser should be called with  atrribute name and value", function() {
        const xmlData = `<element id="7" data="foo bar" bug="foo n bar"/>`;
        const expected = {
            "element": {
                "id":   7,
                "data": "foo bar",
                "bug":  "foo n bar"
            }
        };

        const resultMap = {}

        const options = {
            attributeNamePrefix: "",
            ignoreAttributes:    false,
            parseAttributeValue: true,
            decodeHTMLchar:      true,
            attrValueProcessor: (name, val) => {
                if(resultMap[name]){
                    resultMap[name].push(val)
                }else{
                    resultMap[name] = [val];
                }
                return val;
            }
        };
        const parser = new XMLParser(options);
        let result = parser.parse(xmlData);
        //console.log(JSON.stringify(resultMap,null,4));
        expect(result).toEqual(expected);

        expect(resultMap).toEqual({
            "id": [
                "7"
            ],
            "data": [
                "foo bar"
            ],
            "bug": [
                "foo n bar"
            ]
        });
    });
});