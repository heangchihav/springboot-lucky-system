use actix_web::web;
use crate::handlers;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/branchreport")
            // Health endpoints
            .service(web::resource("/health").route(web::get().to(handlers::health_check)))
            .service(web::resource("/actuator/health").route(web::get().to(handlers::actuator_health)))
            
            // Area endpoints
            .service(web::resource("/areas")
                .route(web::get().to(handlers::list_areas))
                .route(web::post().to(handlers::create_area)))
            .service(web::resource("/areas/{id}")
                .route(web::get().to(handlers::get_area))
                .route(web::put().to(handlers::update_area))
                .route(web::delete().to(handlers::delete_area)))
            
            // Sub-area endpoints
            .service(web::resource("/sub-areas")
                .route(web::get().to(handlers::list_sub_areas))
                .route(web::post().to(handlers::create_sub_area)))
            .service(web::resource("/sub-areas/{id}")
                .route(web::get().to(handlers::get_sub_area))
                .route(web::put().to(handlers::update_sub_area))
                .route(web::delete().to(handlers::delete_sub_area)))
            
            // Branch endpoints
            .service(web::resource("/branches")
                .route(web::get().to(handlers::list_branches))
                .route(web::post().to(handlers::create_branch)))
            .service(web::resource("/branches/{id}")
                .route(web::get().to(handlers::get_branch))
                .route(web::put().to(handlers::update_branch))
                .route(web::delete().to(handlers::delete_branch)))
    );
}
