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

import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.io.Reader;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.xwiki.contrib.cryptpad.hyperjson.HyperJSONParser;
import org.xwiki.rendering.parser.Parser;
import org.xwiki.test.mockito.MockitoComponentMockingRule;

/**
 * @version $Id$
 */
public class DefaultHyperJSONParserTest
{
    @Rule
    public final MockitoComponentMockingRule<DefaultHyperJSONParser> mocker =
        new MockitoComponentMockingRule<>(DefaultHyperJSONParser.class);

    private Parser htmlParser;

    @Before
    public void setUp() throws Exception
    {
        htmlParser = mocker.registerMockComponent(Parser.class, "html/4.01");
        when(htmlParser.parse(any(Reader.class))).thenReturn(null);
    }

    @Test
    public void hyperJSON2HTMLSimpleTest() throws Exception
    {
        HyperJSONParser p = mocker.getComponentUnderTest();
        String json =
            "[\"BODY\",{\"class\":\"cke_editable cke_editable_themed cke_contents_ltr cke_show_borders\",\"contenteditable\":\"true\",\"spellcheck\":\"false\"},[[\"P\",{},[\"Test\",[\"BR\",{},[]]]],[\"P\",{},[\"Test2\"]],[\"P\",{},[\"Test3\",[\"BR\",{},[]]]],[\"P\",{},[]]],{\"metadata\":{\"chat\":\"***\",\"defaultTitle\":\"Texte - mer. 10 octobre 2018\",\"title\":\"Test pad for the Cryptpad importer\",\"type\":\"pad\",\"users\":{\"***\":{\"avatar\":\"***\",\"curvePublic\":\"***\",\"name\":\"***\",\"netfluxId\":\"***\",\"profile\":\"***\",\"uid\":\"***\"}}}}]";
        String expected =
            "<body class=\"cke_editable cke_editable_themed cke_contents_ltr cke_show_borders\" contenteditable=\"true\" spellcheck=\"false\"><p>Test<br/></p><p>Test2</p><p>Test3<br/></p><p/></body>";
        assertEquals(expected, p.hyperJSON2HTML(json));
    }

    @Test
    public void hyperJSON2HTMLAttributesTest() throws Exception
    {
        HyperJSONParser p = mocker.getComponentUnderTest();
        String json =
            "[\"BODY\",{\"class\":\"cke_editable cke_editable_themed cke_contents_ltr cke_show_borders\",\"contenteditable\":\"true\",\"spellcheck\":\"false\"},[[\"H1\",{},[\"Heading 1\",[\"BR\",{},[]]]],[\"P\",{},[[\"STRONG\",{},[\"Bold content\"]],[\"BR\",{},[]]]],[\"P\",{},[[\"STRONG\",{},[]],[\"EM\",{},[\"Italic content\"]],[\"BR\",{},[]]]],[\"P\",{},[[\"U\",{},[\"Underlined content\"]],[\"BR\",{},[]]]],[\"P\",{},[[\"SPAN\",{\"style\":\"background-color:#c0392b;\"},[\"Content on a red background\"]],[\"BR\",{},[]]]],[\"P\",{},[[\"SPAN\",{\"style\":\"color:#2980b9;\"},[\"Content in blue\"]],[\"BR\",{},[]]]]],{\"metadata\":{\"chat\":\"***\",\"defaultTitle\":\"Texte - mer. 10 octobre 2018\",\"title\":\"Test pad for the Cryptpad importer\",\"type\":\"pad\",\"users\":{\"***\":{\"avatar\":\"***\",\"curvePublic\":\"***\",\"name\":\"\",\"netfluxId\":\"***\",\"profile\":\"***\",\"uid\":\"***\"}}}}]";
        String expected =
            "<body class=\"cke_editable cke_editable_themed cke_contents_ltr cke_show_borders\" contenteditable=\"true\" spellcheck=\"false\"><h1>Heading 1<br/></h1><p><strong>Bold content</strong><br/></p><p><strong/><em>Italic content</em><br/></p><p><u>Underlined content</u><br/></p><p><span style=\"background-color:#c0392b;\">Content on a red background</span><br/></p><p><span style=\"color:#2980b9;\">Content in blue</span><br/></p></body>";
        assertEquals(expected, p.hyperJSON2HTML(json));
    }
}
