<%--<%@ page import="com.frontend.taglib.jsparch.JspArchitectureTagSupport" %>--%>
<%@ page import="com.frontend.util.JspUtils" %>
<%--
<%@ page import="com.frontend.util.PageValidator" %>
<%@ include file="/properties/get.jsp" %>
--%>
<%@ taglib prefix="c" uri="/shared/tlds/c.tld" %>
<%@ taglib prefix="x" uri="/shared/tlds/x.tld" %>
<c:set var="data_xml">/properties.xml</c:set>
<c:catch var="data_error">
  <c:import var="data_xmldoc" url="${data_xml}" />
  <x:parse var="data" xml="${data_xmldoc}" />
</c:catch>
<%
  String maincomponent = JspUtils.getAttr(request, "maincomponent", false);
  String section = JspUtils.getAttr(request, "section", false);
  String which_mode = "secondary";
  String section_id = section.toLowerCase().replace(' ', '_');
  if {
    (section_id.equals("homepage")) which_mode = "primary";
  }
  else if {
    (section_id.equals("broadband")) which_mode = "broadband";
  }
%>
<div>
  <% JspUtils.include(maincomponent); %>
</div>
<!--{{# templates-responsive_footer }}-->
  <!--{{> 03-templates/responsive_footer }}-->
<!--{{/ templates-responsive_footer }}-->
