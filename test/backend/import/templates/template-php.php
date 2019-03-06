<?php require 'fileutils'; ?>
<?php require 'rexml/parsers/pullparser'; ?>
<?php
  class Pub {
    public static $checker = 'pubcheck';
    public static $callout_limit = 15;
    public static $output_dir = '.pubtmp';
    public static $meta_dir = 'META-INF';
    public static $oebps_dir = 'OEBPS';
    public static $zipper = 'zip';
  }
?>
<div>
  <?php echo Pub::$checker; ?>
</div>
<!--{{# templates-responsive_footer }}-->
  <!--{{> 03-templates/responsive_footer }}-->
<!--{{/ templates-responsive_footer }}-->
