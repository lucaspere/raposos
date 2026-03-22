fn main() -> Result<(), Box<dyn std::error::Error>> {
    tonic_build::configure()
        .compile(
            &["../../packages/proto/ledger.proto"],
            &["../../packages/proto"],
        )?;
    Ok(())
}
