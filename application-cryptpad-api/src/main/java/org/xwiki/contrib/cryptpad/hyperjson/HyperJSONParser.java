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
package org.xwiki.contrib.cryptpad.hyperjson;

import org.xwiki.component.annotation.Role;
import org.xwiki.contrib.cryptpad.CryptpadException;
import org.xwiki.rendering.block.XDOM;

/**
 * HyperJSON parser to XHTML and XDOM.
 * 
 * @version $Id$
 */
@Role
public interface HyperJSONParser
{
    /**
     * Parses the passed hyperJSON to HTML.
     * 
     * @param hyperJSON hyperjson
     * @return the html corresponding to the hyperjson
     * @throws CryptpadException should anything go wrong during json parsing or transforming that to html
     */
    String hyperJSON2HTML(String hyperJSON) throws CryptpadException;

    /**
     * Parses the passed hyperJSON to XDOM (using the XHTML parser).
     * 
     * @param hyperJSON hyperjson
     * @return the XDOM corresponding to the hyperjson
     * @throws CryptpadException should anything go wrong during json parsing or transforming that to XDOM (through html
     *             parser)
     */
    XDOM hyperJSON2XDOM(String hyperJSON) throws CryptpadException;
}
