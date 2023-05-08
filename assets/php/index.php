<?php
/**
 *
 */
    $index = __DIR__ . '/app/index.html';
    if ( file_exists($index) ){
        define( 'WP_USE_THEMES', false ); 
        header('Last-Modified: '.gmdate('D, d M Y H:i:s', filemtime($index)).' GMT', true, 200);
        echo file_get_contents($index, false);
    } else {
    }
