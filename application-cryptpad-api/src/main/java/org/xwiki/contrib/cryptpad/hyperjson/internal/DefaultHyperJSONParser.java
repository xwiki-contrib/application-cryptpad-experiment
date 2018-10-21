/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 */
package org.xwiki.contrib.cryptpad.hyperjson.internal;

import java.io.StringReader;
import java.util.List;
import java.util.Map;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.dom4j.Branch;
import org.dom4j.Document;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xwiki.component.annotation.Component;
import org.xwiki.contrib.cryptpad.CryptpadException;
import org.xwiki.contrib.cryptpad.hyperjson.HyperJSONParser;
import org.xwiki.rendering.block.XDOM;
import org.xwiki.rendering.parser.Parser;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * @version $Id$
 */
@Component
@Singleton
public class DefaultHyperJSONParser implements HyperJSONParser
{
    private static final Logger LOGGER = LoggerFactory.getLogger(DefaultHyperJSONParser.class);

    @Inject
    @Named("xhtml/1.0")
    private Parser xhtmlParser;

    /**
     * {@inheritDoc}
     * 
     * @see org.xwiki.contrib.cryptpad.hyperjson.HyperJSONParser#hyperJSON2HTML(java.lang.String)
     */
    @Override
    public String hyperJSON2HTML(String hyperJSON) throws CryptpadException
    {
        Object parsedJSON = null;

        // parse the hyperjson
        if (StringUtils.isNotBlank(hyperJSON)) {
            ObjectMapper objectMapper = new ObjectMapper();

            try {
                parsedJSON = objectMapper.readValue(hyperJSON, Object.class);
            } catch (Exception e) {
                LOGGER.info("Failed to parse JSON [{}]: ", StringUtils.abbreviate(hyperJSON, 32),
                    ExceptionUtils.getRootCauseMessage(e));
                throw new CryptpadException("Failed to parse JSON ", e);
            }
        }
        // transform the parsed json in document
        if (parsedJSON != null) {
            Document document = DocumentHelper.createDocument();

            try {
                // produce the document from the json, recursively
                parseElement(parsedJSON, document);

            } catch (ArrayIndexOutOfBoundsException e) {
                String errorMsg = "Unexpected number of elements in a list object in hyperJSON";
                LOGGER.error(errorMsg, e);
                throw new CryptpadException(errorMsg, e);
            } catch (Exception e) {
                String errorMsg = "Unknown exception in building document from json";
                LOGGER.error(errorMsg, e);
                throw new CryptpadException(errorMsg, e);
            }
            // serialize the document to string
            String documentAsString = document.asXML();
            // trick to exclude the xml prolog
            int indexOfBody = documentAsString.indexOf("<body");
            if (indexOfBody > 0) {
                return documentAsString.substring(indexOfBody);
            } else {
                return documentAsString;
            }
        } else {
            throw new CryptpadException("HyperJSON " + StringUtils.abbreviate(hyperJSON, 32)
                + " was parsed into a null object, cannot continue");
        }
    }

    /**
     * Parses the hyperelement as read from JSON into a piece of dom4j.
     * 
     * @param hyperElt the element, as read from JSON
     * @param parent the parent in which this element is to be added, after parsing.
     */
    private void parseElement(Object hyperElt, Branch parent)
    {
        if (hyperElt instanceof List) {
            LOGGER.debug("Found an element of type list in JSON");
            String name = (String) ((List) hyperElt).get(0);
            Map<String, String> attributes = (Map<String, String>) ((List) hyperElt).get(1);
            List children = (List) ((List) hyperElt).get(2);

            Element newElt = parent.addElement(name.toLowerCase());
            for (Map.Entry<String, String> me : attributes.entrySet()) {
                String attr = me.getKey().toString() + "";
                String value = me.getValue().toString() + "";
                newElt.addAttribute(attr, value);
            }
            for (Object c : children) {
                parseElement(c, newElt);
            }
        } else if (hyperElt instanceof String) {
            if (parent instanceof Element) {
                ((Element) parent).addText((String) hyperElt);
            } else {
                LOGGER.warn("Text content " + hyperElt + " found in element " + parent
                    + " and could not be added in the document because parent is not an element!");
            }
        }
    }

    /**
     * {@inheritDoc}
     * 
     * @see org.xwiki.contrib.cryptpad.hyperjson.HyperJSONParser#hyperJSON2XDOM(java.lang.String)
     */
    @Override
    public XDOM hyperJSON2XDOM(String hyperJSON) throws CryptpadException
    {
        String html = this.hyperJSON2HTML(hyperJSON);

        XDOM result;
        try {
            result = this.xhtmlParser.parse(new StringReader(html));
        } catch (Exception e) {
            throw new CryptpadException("Could not transform html to XDOM", e);
        }
        return result;
    }
}
