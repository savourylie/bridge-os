use std::{fs, path::PathBuf};

fn main() {
    let output = task_models::ipc_typescript();
    let output_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join(task_models::IPC_TYPES_RELATIVE_PATH);

    fs::write(&output_path, output).expect("write generated IPC types");
    println!("wrote {}", output_path.display());
}
