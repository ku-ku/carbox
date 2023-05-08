<?php
/**
 */

remove_filter( 'the_content', 'wpautop' );
add_theme_support( 'menus' );
add_theme_support( 'post-thumbnails' );

add_action('wp_enqueue_scripts', function(){
    wp_dequeue_script('jquery-masonry');
});

add_action('wp_mail_from_name', function($from_name){
    return mb_encode_mimeheader($from_name,"UTF-8", "B");
});

add_action('init', function(){
/*    
    if(!session_id()) {
        session_start();
    }
 * 
 */
    register_post_types();
});


function register_post_types(){
    register_post_type( 'taxi', [
		'label'  => 'Taxi',
		'labels' => [
			'name'               => 'taxi', 
			'singular_name'      => 'taxi', 
			'add_new'            => 'Добавить taxi', 
			'add_new_item'       => 'Добавление taxi',
			'edit_item'          => 'Редактирование taxi',
			'new_item'           => 'Новое taxi',
			'view_item'          => 'Смотреть taxi',
			'search_items'       => 'Искать taxi',
			'not_found'          => 'Не найдено',
			'not_found_in_trash' => 'Не найдено в корзине',
			'parent_item_colon'  => '',
			'menu_name'          => 'taxi'
		],
		'description'            => '',
		'public'                 => true,
		'exclude_from_search' => true,
		'show_in_menu'           => null, // показывать ли в меню админки
		'show_in_rest'        => true, 
		'rest_base'           => null, 
		'menu_position'       => null,
		'menu_icon'           => null,
		'hierarchical'        => false,
		'supports'            => ['title', 'editor', 'comments'], 
		'taxonomies'          => [],
		'has_archive'         => false,
		'rewrite'             => true,
		'query_var'           => true,
	] );    
}   //register_post_types

//== 2.0 site supporting =======================================================
/**
 * Get a basic site meta information & main-menu items (cached)
 * @return array
 */
function yug_get_meta(){
    global $wpdb;
    $last = $wpdb->get_var($wpdb->prepare("
                select max(p.post_modified_gmt) from $wpdb->posts p where p.post_type='taxi'
            ")
    );
    $cache_key = "kih_meta";
    $meta = wp_cache_get( $cache_key );
    $meta = false;  //TODO:
    if( $meta === false ){
        $main_menu = array();
        $menu_items = wp_get_nav_menu_items("main-menu");
        if ( !is_wp_error( $menu_items ) ){
            foreach( $menu_items as $item ) {
                $main_menu[] = array(
                    "id" => $item->ID,
                    "title" => $item->title,
                    "url" => $item->url,
                    "object" => $item->object,
                    "oid" => $item->object_id
                );
            }
        }
        $last = DateTime::createFromFormat('Y-m-d H:i:s', $last);
        
        $meta = array(
            "meta" => array(
                "at" => $last->getTimestamp() * 1000,
                "id" => get_main_site_id(),
                "name" => get_bloginfo("name"),
                "description" => get_bloginfo("description", "display"),
                "menu" => $main_menu,
                "uri" => get_template_directory_uri(),
                "ajax" => admin_url('admin-ajax.php'),
                "nonce" => wp_create_nonce( 'wp_rest' ),
            )
        );
        wp_cache_set( $cache_key, $meta );
    } else {
        $meta["meta"]["cached"] = 1;
    }
    $meta["meta"]["nonce"] = wp_create_nonce( 'wp_rest' );
    header("Pragma: cache");
    header("Cache-Control: max-age=36000, public, must-revalidate");
    header("Last-Modified: " . gmdate('D, d M Y H:i:s ', $last->getTimestamp()));
    
    return $meta;
}   //mks_get_meta


function yug_get_image($id){
    global $wpdb;
    $q = $wpdb->get_row(
        $wpdb->prepare("
                select p.id, p.post_mime_type, p.post_modified_gmt, p.guid, m.meta_value 
                    from $wpdb->posts p, $wpdb->postmeta m
                    where p.id = %d and m.post_id = p.id and m.meta_key = %s
                ", $id, '_wp_attached_file'
    ));

    if ( empty($wpdb->last_error) && ($wpdb->num_rows > 0) ) {
        return esc_attr($q->guid);
    }
    return '';
}

function yug_feedback(){
    $adm = get_option('admin_email');
    //$adm = "the-lix@yandex.ru";
    $from = 'From: kih.ru <site@kih.ru>';                                                               
    $message = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">'."\r\n".'<html><head>'
              .'<meta charset="UTF-8" />'
              .'<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />'
              .'</head><body>';
    $message .= '<h2 style="margin:3rem 0;font-weight:400;">Запрос с сайта</h2>';                                                                       
    $message .= '<p><b>' . date('d.m.Y H:i').'</b><br />Пользователь <b>' . $_REQUEST["name"] . '</b> запросил обратную связь с сайта</p>';
    if ( isset($_REQUEST["phone"]) && !empty($_REQUEST["phone"]) ){
        $message .= '<p>Телефон для связи <b>'. $_REQUEST["phone"] .'</b></p>';
    }
    if ( isset($_REQUEST["email"]) && !empty($_REQUEST["email"]) ){
        $message .= '<p>E-mail: <a href="mailto:' . $_REQUEST["email"] .'">' . $_REQUEST["email"] . '</a></p>';
    }
    if ( isset($_REQUEST["message"]) && !empty($_REQUEST["message"]) ){
        $message .= '<p>' . $_REQUEST["message"] . '</p>';
    }
    $message .= '</body></html>';
    $headers  = array();
    $headers[] = $from;
    $headers[] = 'Content-type: text/html;charset=utf-8';
    $headers[] = 'Date: '.gmdate("D, d M Y H:i:s", time())." GMT";
    $success   = wp_mail( $adm, '==== СООБЩЕНИЕ С САЙТА ====', $message, $headers);
    if ( $success ) {
        wp_send_json_success( array('to'=>$adm, 'res'=>$success) );
    } else {
        wp_send_json_error();
    }
    wp_die();
}   //msk_feedback


add_action('rest_api_init', function(){
    register_rest_route('v1/kih', '/meta', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback' => 'yug_get_meta',
        'permission_callback' => '__return_true'
    ) );
    register_rest_route('v1/kih', '/feedback', array(
        'methods'             => WP_REST_Server::CREATABLE,
        'callback' => 'yug_feedback',
        'permission_callback' => '__return_true'
    ) );
    
    register_rest_field('post', 'src',
        array(
            'get_callback'          => function( $p ){
                if (isset($p['featured_media'])){
                    return yug_get_image($p['featured_media']);
                }
        
                $image = wp_get_attachment_image_src($p['id'], 'large');
                return ($image && sizeof($image)) ? $image[0] : null;
            },
            'show_in_rest'          => true,
            'auth_callback'	    => '__return_true'
        )
    );
    register_rest_route('taxi/v1', '/references', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback' => 'yug_get_references',
        'permission_callback' => '__return_true',
        'args' => array(
			'id' => array(
                            'default'           => '',
                            'required'          => true,
                            'type'              => 'string',
                            'validate_callback' => '__return_true',
			)
        )
    ) );
    
    register_rest_route('taxi/v1', '/taxi', 
        array(
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback' => 'yug_get_taxi',
                'permission_callback' => '__return_true',
                'args' => array(
			'id' => array(
                            'default'           => -1,
                            'required'          => false,
                            'type'              => 'integer',
                            'validate_callback' => '__return_true',
			)
                )
            ),
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback' => 'yug_save_taxi',
                'permission_callback' => '__return_true',
                'args' => array(
			'taxi' => array(
                            'required'          => true,
                            'type'              => 'object',
                            'validate_callback' => '__return_true',
			),
                 )
            ) 
        )
    );  //'taxi/v1', '/taxi'

    register_rest_route('taxi/v1', '/exo', 
        array(
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback' => 'yug_user_info',
                'permission_callback' => '__return_true',
                'args' => array(
			'id' => array(
                            'default'           => -1,
                            'required'          => false,
                            'type'              => 'integer',
                            'validate_callback' => '__return_true',
			)
                )
            ),
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback' => 'yug_do_exo',
                'permission_callback' => '__return_true',
                'args' => array(
			'exo' => array(
                            'required'          => false,
                            'type'              => 'object',
                            'validate_callback' => '__return_true',
			),
                 )
            ) 
        )
    );  //'taxi/v1', '/exo'
   
});

function yug_user_info(){
    $user = wp_get_current_user();
    if (
            $user->ID > 0
       ){
        wp_send_json_success( array(
            "id"    => $user->ID, 
            "name"  => $user->display_name,
            "admin" => in_array("administrator", $user->roles)
        ) );
    } else {
        wp_send_json_error();
    }
}
add_action( 'wp_ajax_user', 'yug_user_info' );
add_action( 'wp_ajax_nopriv_user', 'yug_user_info' );


function yug_do_exo($request){
    $params = $request->get_json_params();
    $user = wp_get_current_user();
    if( is_wp_error($params) ){
        wp_send_json_error(array("error" => $params));
    } else {
        $exo = $params["exo"];
        if ( ( $exo )&&isset($exo["u"]) ){
            $creds = array(
                "user_login" => $exo["u"],
                "user_password" => $exo["p"],
                "remember"   => true
            );
            $user = wp_signon( $creds );
            if ( !is_wp_error($user) ){
                wp_set_current_user( $user->ID );
                wp_set_auth_cookie( $user->ID );
                do_action( 'wp_login', $user->user_login );
            }
        } else if ( isset($exo["logout"]) ){
            wp_logout();
            $user = wp_get_current_user();
        }
        if ( is_wp_error($user) ) {
            wp_send_json_error(array("error" => $user->get_error_message()));
        } else {
            wp_send_json_success( array(
                "id"    => $user->ID, 
                "name"  => $user->display_name,
                "admin" => in_array("administrator", $user->roles)
            ) );
        }
    }
}   //yug_do_exo


function yug_get_references(){
    global $wpdb;
    $q = $_REQUEST["q"];
    
    if ($q==="manager"){
        $rows = $wpdb->get_results(
                    $wpdb->prepare("
                            select ID id, display_name name
                              from $wpdb->users
                              order by display_name
                            "
                    )
        );
    } else {
        $rows = $wpdb->get_results(
                $wpdb->prepare("
                        select distinct m.meta_value name,
                                        ( select min(m1.meta_id) from $wpdb->postmeta m1
                                            where m1.meta_key = m.meta_key and m1.meta_value = m.meta_value) id
                          from $wpdb->postmeta m, $wpdb->posts p 
                          where p.post_type='taxi' and p.id = m.post_id and m.meta_key = %s
                          order by m.meta_value
                        ", $q
                )
            );
    }
    if ( $wpdb->last_error ) {
        wp_send_json_error($wpdb->last_error);
    } else {
        wp_send_json_success( $rows );
    }
}

function yug_get_taxi($request){
    $params = $request->get_params();
    
    if ( isset($params["remote"]) ){
        return yug_get_external($params["gov"]);
    }
    
    $args = array(
        'post_type'   => 'taxi',
        'post_status' => 'publish',
        'posts_per_page' => -1,
	'nopaging' => true,
        'orderby'     => array( 'modified' => 'DESC' )
    );
    $s = false;
    if ( ($params["id"]) && intval($params["id"]) > 0 ){
        $args["p"] = $params["id"];
    } else if ( $params["gov"] ){
        $args["title"] = mb_strtoupper($params["gov"], "utf-8");    
    } else if ( isset($params["s"]) ){
        $s = $params["s"];
    }
    $p = new WP_Query( $args );
    $data = array();
    $n = 0;
    while ( $p->have_posts() ){
        $fAdd = ( $n < 20 );
        $p->the_post();
        $item = json_decode(get_the_content());
        $item->id = get_the_id();
        $dt = get_post_datetime($p->$post);
        $item->date = $dt->getTimestamp()*1000;
        $item->gov  = get_the_title();
        $mdt = get_post_datetime($p->$post, 'modified');
        $item->modified = $mdt->getTimestamp()*1000;
        
/*  TODO: filtering
        if ( !$fAdd ){
            if ($s !== false){
                $fAdd = ($s === "all")
                        || ($s == $item->permNum)
                        || mb_stripos($item->gov, $s, 0, 'UTF-8') 
                        || mb_stripos($item->ownName, $s, 0, 'UTF-8')
                        || mb_stripos($item->drivName, $s, 0, 'UTF-8');
            }
        }
        if ($fAdd){
            $data[] = $item;
        }
 * 
 * 
 */
        $n++;
        $data[] = $item;
    }
    wp_send_json_success($data);
}   //yug_get_taxi

function yug_remove_taxi( $id ){
    global $wpdb;
    
    $p = wp_delete_post( $id, true );
    
    if ( $p ){
        wp_send_json_success( array("id"=>$id) );
    } else {
        wp_send_json_error( array("error"=>$wpdb->last_error) );
    }
}   //yug_remove_taxi

function yug_save_taxi( $request ){
    $params = $request->get_json_params();
    
    if( is_wp_error($params) ){
        wp_send_json_error(array("error" => $params));
    } else {
        $taxi = $params["taxi"];
        if (isset($taxi["rm"])&&(1===(int)$taxi["rm"])){
            yug_remove_taxi($taxi["id"]);
            return;
        }
        
        $taxi["gov"] = mb_strtoupper($taxi["gov"], "utf-8");
        
        $args = array(
            'post_type'   => 'taxi',
            'post_status' => 'publish',
        );
        
        if ((int)$taxi["id"] > 0){
            $args["p"] = $taxi["id"];
        } else {
            $args["title"] = $taxi["gov"];
        }
        $p = new WP_Query( $args );
        
        $taxi["ID"] = $p->have_posts() ? $p->posts[0]->ID : 0;
        
        $post_data = array(
            'ID'            => $taxi["ID"],
            'post_type'     => 'taxi',
            'post_title'    => $taxi["gov"],
            'post_content'  => json_encode($taxi, JSON_UNESCAPED_UNICODE),
            'post_status'   => 'publish',
            'post_author'   => 35,
            'comment_status'=> 'closed',
            'ping_status'   => 'closed',
            'meta_input'    => array(
                "town"      => $taxi["town"],
                "manager"   => $taxi["manager"],
                "informant" => $taxi["informant"],
                "model"     => $taxi["model"]
            )
        );
        
        $post_id = wp_insert_post($post_data, true);
        
        if( is_wp_error($post_id) ){
            wp_send_json_error( array("error"=>$post_id->get_error_message()) );
        } else {
            wp_send_json_success( array("id"=>$post_id) );
        }
    }
}   //yug_save_taxi

function yug_get_external( $gov ){
    $response = wp_remote_get( 'https://taxi.mt.krasnodar.ru/api/v1/taxi/search?mode=1&value='. $gov );
    if ( is_array( $response ) ) {
        wp_send_json_success( json_decode($response['body']) );
    } else {
        wp_send_json_error( $response->get_error_message() );
    }
}